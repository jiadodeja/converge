"""
Converge Backend API Server
Works for four ADP business lines: HR, Payroll, Insurance and Retirement.

Main endpoints:
  POST /api/insights/generate     one business (set "domain" in the request)
  POST /api/insights/analyze-all  the AI picks every business the message touches
  POST /api/slack/events          Slack webhook (HR)
  GET  /api/slack/feed            what the dashboard shows in Live mode
  POST /api/slack/feed/{id}/done    close a case (how = "adp" or "manual")
  POST /api/slack/feed/{id}/reopen  open a closed case again
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from typing import Dict, List, Optional
from dotenv import load_dotenv

from fastapi import BackgroundTasks, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_core.prompts import ChatPromptTemplate
from langchain_chroma import Chroma

import ai_provider
from domains import DOMAINS, DOMAIN_IDS, get_domain, keyword_route
from schemas import InsightRequest, HRActionPlan, RouteDecision

# Load environment configuration
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIRECTORY", os.path.join(BASE_DIR, "chroma_db"))
DATA_DIR = os.path.join(BASE_DIR, "data")


def pdf_path_for(domain: str) -> str:
    return os.path.join(DATA_DIR, get_domain(domain)["pdf_file"])


# One vector store per business, made the first time it is needed
vector_stores: Dict[str, Chroma] = {}


def check_api_key():
    """Stops early with a clear message if the AI key is missing."""
    if not ai_provider.get_api_key():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"{ai_provider.key_env_name()} is not configured. Please add it to "
                "backend/.env to enable policy search and AI synthesis."
            )
        )


def get_vector_store(domain: str) -> Chroma:
    """Returns the Chroma store for one business."""
    if domain in vector_stores:
        return vector_stores[domain]

    check_api_key()
    vector_stores[domain] = Chroma(
        persist_directory=CHROMA_DIR,
        collection_name=ai_provider.get_collection_name(domain),
        embedding_function=ai_provider.get_embeddings()
    )
    return vector_stores[domain]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: make any sample PDFs that are missing."""
    print("[FastAPI Startup] Initializing Converge Backend...")
    print(f"[FastAPI Startup] AI provider: {ai_provider.PROVIDER} ({ai_provider.chat_model_name()})")
    missing = [d for d in DOMAIN_IDS if not os.path.exists(pdf_path_for(d))]
    if missing:
        print(f"[FastAPI Startup] Generating sample documents for: {', '.join(missing)}")
        try:
            from data.generate_pdf import main as gen_pdf
            gen_pdf()
        except Exception as e:
            print(f"[FastAPI Startup] Error generating PDFs: {e}")
    yield
    print("[FastAPI Shutdown] Converge Backend stopped.")


app = FastAPI(
    title="Converge Enterprise Intelligence API",
    description="Turns messy messages and long policy documents into actionable plans for ADP HR, Payroll, Insurance and Retirement.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration for Next.js frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "service": "Converge Enterprise Intelligence API",
        "version": "2.0.0",
        "status": "online",
        "docs_url": "/docs",
        "domains": DOMAIN_IDS,
        "endpoints": {
            "insights_generate": "POST /api/insights/generate",
            "insights_analyze_all": "POST /api/insights/analyze-all",
            "health": "GET /health"
        }
    }


@app.get("/health")
def health_check():
    api_key_set = bool(ai_provider.get_api_key())
    return {
        "status": "healthy",
        "ai_provider": ai_provider.PROVIDER,
        "chat_model": ai_provider.chat_model_name(),
        "embedding_model": ai_provider.embedding_model_name(),
        "api_key_configured": api_key_set,
        "chroma_dir_exists": os.path.exists(CHROMA_DIR),
        "domains": {
            d: {
                "name": DOMAINS[d]["name"],
                "pdf_exists": os.path.exists(pdf_path_for(d)),
                "collection": ai_provider.get_collection_name(d),
            }
            for d in DOMAIN_IDS
        },
    }


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_TEMPLATE = """You are "Converge", an enterprise copilot for the ADP {business} business line.
Your job is to turn messy, unclear messages (Slack, email, tickets) into verified, actionable plans by checking them against the official policy documents.
The person who will read your answer is a {user_role}.

You will be given:
1. The raw message from the employee.
2. Verified excerpts from the {doc_title}, found with semantic search.

Instructions:
- The message may touch several business lines. Answer ONLY the {business} part of it.
- Check the request against the policy context.
- {focus}
- Give clear, ordered next steps for the {user_role}.
- Choose the mocked ADP REST API endpoint that records this action. Examples: {adp_examples}. Do not call real APIs. Give a realistic mocked endpoint path.
{guardrails}

Fill in these fields:
- eligibility_summary: Plain-English summary of what applies and which policy sections you used.
- recommended_action: Step-by-step guidance for the {user_role}.
- adp_api_endpoint: The mocked ADP REST API endpoint string.
- headline: One sentence saying what the employee is asking for.
- category: Exactly one of: {categories}.
- urgency: High, Medium or Low.
- eligibility_status: Eligible, Conditional or Ineligible.
- eligibility_headline: Very short label (max 8 words) of the result.
- key_points: 2 to 4 short bullets of the policy facts that apply.
- statutory_citation: The policy section or law used. Leave empty if the context does not name one.
- checklist: 3 to 5 short action steps, in order.
- suggested_slack_reply: A friendly, short reply to send to the employee.
- highlights: 3 or 4 key facts as label and value pairs (for example Deadline: 30 days after the birth). Keep each value under 8 words.
Only use facts that are in the policy context. If the context does not answer the question, say so and set eligibility_status to Conditional.
"""

USER_PROMPT_TEMPLATE = """Employee ID: {employee_id}
Handled by: {manager_id}

[RAW MESSAGE FROM EMPLOYEE]:
"{message}"

[RETRIEVED POLICY CONTEXT]:
{context}
"""

ROUTER_PROMPT_TEMPLATE = """You decide which ADP business lines are involved in an employee message.

Business lines:
{descriptions}

Pick every business line that has something to act on. Pick at least one and at most four.
Return only the ids (hr, payroll, insurance, retirement) and one short reason.
"""


def build_system_prompt(domain: str) -> str:
    cfg = get_domain(domain)
    guardrails = f"- {cfg['guardrails']}" if cfg["guardrails"] else ""
    return SYSTEM_PROMPT_TEMPLATE.format(
        business=cfg["name"],
        user_role=cfg["user_role"],
        doc_title=cfg["doc_title"],
        focus=cfg["focus"],
        adp_examples=", ".join(cfg["adp_examples"]),
        guardrails=guardrails,
        categories=", ".join(cfg["categories"]),
    )


# The feed that the dashboard shows in Live mode.
# It is saved to a small JSON file so a restart does not lose open cases.
# Open cases are kept until someone closes them. Closed cases are kept for 7 days.
FEED_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "feed_store.json")
DONE_KEEP_DAYS = 7


def load_feed() -> List[dict]:
    try:
        with open(FEED_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, ValueError):
        return []


def save_feed() -> None:
    try:
        with open(FEED_FILE, "w", encoding="utf-8") as f:
            json.dump(LIVE_SLACK_FEED, f)
    except OSError as e:
        print(f"[Feed] Could not save feed file: {e}")


def purge_old_done() -> None:
    """Remove closed cases that are older than DONE_KEEP_DAYS. Open cases are never removed."""
    limit = datetime.now() - timedelta(days=DONE_KEEP_DAYS)
    keep = []
    for rec in LIVE_SLACK_FEED:
        done_at = rec.get("done_at")
        if rec.get("status") == "done" and done_at and datetime.fromisoformat(done_at) < limit:
            continue
        keep.append(rec)
    LIVE_SLACK_FEED[:] = keep


LIVE_SLACK_FEED: List[dict] = load_feed()
purge_old_done()


def next_feed_id() -> str:
    numbers = [int(r["id"].split("-")[-1]) for r in LIVE_SLACK_FEED if str(r.get("id", "")).startswith("evt-")]
    return f"evt-{max(numbers, default=0) + 1}"


def add_to_feed(domain: str, employee_id: str, employee_name: str, manager_id: str, message: str,
                plan: HRActionPlan, sources: List[dict], source: str, group_id: Optional[str] = None) -> dict:
    record = {
        "id": next_feed_id(),
        "domain": domain,
        "group_id": group_id,
        "employee_id": employee_id,
        "employee_name": employee_name,
        "manager_id": manager_id,
        "message": message,
        "insight": plan.model_dump(),
        "sources": sources,
        "received_at": datetime.now().isoformat(timespec="seconds"),
        "timestamp": "Just now",
        "source": source,
        "status": "open",      # "open" or "done"
        "done_at": None,
        "done_how": None,      # "adp" or "manual"
    }
    LIVE_SLACK_FEED.append(record)
    purge_old_done()
    save_feed()
    return record


# ---------------------------------------------------------------------------
# Core pipeline
# ---------------------------------------------------------------------------

async def synthesize_rag_insight(employee_id: str, manager_id: str, message: str, domain: str = "hr") -> tuple:
    """
    Core RAG pipeline for one business. Returns the plan and the policy excerpts used.
    1. Finds the top 3 policy chunks for this business in ChromaDB.
    2. Asks the AI model for a structured plan.
    """
    get_domain(domain)  # raises KeyError for an unknown business
    check_api_key()

    store = get_vector_store(domain)
    retrieved_docs = store.similarity_search(query=message, k=3)

    context_texts = []
    for idx, doc in enumerate(retrieved_docs, start=1):
        context_texts.append(f"--- Document Chunk {idx} ---\n{doc.page_content.strip()}")

    context_block = "\n\n".join(context_texts) if context_texts else "No policy documents found in index."

    llm = ai_provider.get_llm()
    structured_llm = llm.with_structured_output(HRActionPlan)

    # The system text goes in as a variable so curly braces in it are never treated as placeholders
    prompt = ChatPromptTemplate.from_messages([
        ("system", "{system_text}"),
        ("user", USER_PROMPT_TEMPLATE),
    ])

    chain = prompt | structured_llm

    result: HRActionPlan = await chain.ainvoke({
        "system_text": build_system_prompt(domain),
        "employee_id": employee_id,
        "manager_id": manager_id,
        "message": message,
        "context": context_block,
    })
    result.domain = domain

    sources = []
    for doc in retrieved_docs:
        page = doc.metadata.get("page")
        sources.append({
            "text": doc.page_content.strip(),
            "page": page + 1 if isinstance(page, int) else None,
        })

    return result, sources


async def route_message(message: str) -> dict:
    """
    Decides which business lines a message touches.
    Uses the AI model first. If that fails (for example a rate limit), it falls back to keywords.
    """
    try:
        check_api_key()
        descriptions = "\n".join(f"- {d}: {DOMAINS[d]['router_hint']}" for d in DOMAIN_IDS)
        prompt = ChatPromptTemplate.from_messages([
            ("system", "{system_text}"),
            ("user", "Message: {message}"),
        ])
        chain = prompt | ai_provider.get_llm().with_structured_output(RouteDecision)
        decision = await chain.ainvoke({
            "system_text": ROUTER_PROMPT_TEMPLATE.format(descriptions=descriptions),
            "message": message,
        })
        picked = [x.strip().lower() for x in decision.domains]
        domains = [d for d in DOMAIN_IDS if d in picked]  # keeps a fixed order, drops unknown names
        if domains:
            return {"domains": domains, "reason": decision.reason, "method": "ai"}
    except Exception as e:
        print(f"[Router] AI router failed, using keywords instead: {e}")

    return {
        "domains": keyword_route(message),
        "reason": "Matched by keywords (the AI router was not available).",
        "method": "keywords",
    }


@app.post("/api/insights/generate", response_model=HRActionPlan)
async def generate_insight(payload: InsightRequest):
    """
    Direct RAG synthesis for ONE business. Set "domain" to hr, payroll, insurance or retirement.
    """
    if payload.domain not in DOMAINS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown domain '{payload.domain}'. Use one of: {', '.join(DOMAIN_IDS)}"
        )
    try:
        result, sources = await synthesize_rag_insight(
            employee_id=payload.employee_id,
            manager_id=payload.manager_id,
            message=payload.message,
            domain=payload.domain
        )

        add_to_feed(payload.domain, payload.employee_id, payload.employee_name, payload.manager_id,
                    payload.message, result, sources, source="api")
        return result
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[Error in generate_insight] {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating insight: {str(exc)}"
        )


@app.post("/api/insights/analyze-all")
async def analyze_all(payload: InsightRequest):
    """
    One message, every business it touches.
    1. The router picks the business lines.
    2. Each business runs its own policy search and plan, at the same time.
    3. Results share a group_id so the dashboard can show them side by side.
    """
    check_api_key()
    route = await route_message(payload.message)
    group_id = f"grp-{datetime.now().strftime('%H%M%S%f')}"

    outcomes = await asyncio.gather(
        *[
            synthesize_rag_insight(payload.employee_id, payload.manager_id, payload.message, d)
            for d in route["domains"]
        ],
        return_exceptions=True
    )

    results = []
    errors = {}
    for domain, outcome in zip(route["domains"], outcomes):
        if isinstance(outcome, Exception):
            print(f"[analyze-all] {domain} failed: {outcome}")
            errors[domain] = str(outcome)
            continue
        plan, sources = outcome
        add_to_feed(domain, payload.employee_id, payload.employee_name, payload.manager_id,
                    payload.message, plan, sources, source="api", group_id=group_id)
        results.append({"domain": domain, "insight": plan.model_dump(), "sources": sources})

    if not results:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Every business failed. Errors: {errors}"
        )

    return {
        "group_id": group_id,
        "message": payload.message,
        "routing": route,
        "results": results,
        "errors": errors,
    }


# ---------------------------------------------------------------------------
# Slack (HR)
# ---------------------------------------------------------------------------

# Slack message keys we already handled (Slack can send the same event twice)
SEEN_SLACK_MESSAGES = set()


def get_slack_user_name(user_id: str, bot_token: Optional[str]) -> str:
    """Looks up the real name of a Slack user. Falls back to the id."""
    if not bot_token:
        return user_id
    try:
        import requests
        res = requests.get(
            "https://slack.com/api/users.info",
            headers={"Authorization": f"Bearer {bot_token}"},
            params={"user": user_id},
            timeout=5,
        ).json()
        if res.get("ok"):
            user = res["user"]
            return user.get("real_name") or user.get("name") or user_id
    except Exception as e:
        print(f"[Slack] Could not look up user name: {e}")
    return user_id


async def process_slack_message(text: str, user_id: str, channel_id: str, ts: str):
    """
    Runs in the background so the webhook can answer Slack right away.
    Makes the insight, saves it to the feed, and replies in the Slack thread.
    """
    bot_token = os.getenv("SLACK_BOT_TOKEN")
    try:
        insight, sources = await synthesize_rag_insight(
            employee_id=user_id,
            manager_id="sarah-connor",
            message=text,
            domain="hr"
        )

        user_name = await asyncio.to_thread(get_slack_user_name, user_id, bot_token)

        record = add_to_feed("hr", user_id, user_name, "sarah-connor", text, insight, sources,
                             source="slack_webhook")
        record["id"] = f"slack-{ts}"
        record["channel_id"] = channel_id
        record["replied_in_slack"] = False

        # Post a threaded reply in Slack if a bot token is set
        if bot_token and channel_id and ts:
            import requests
            reply_text = (
                f"*[Converge AI HR Synthesis]*\n\n"
                f"*Eligibility*: {insight.eligibility_summary}\n\n"
                f"*Next Steps*: {insight.recommended_action}\n\n"
                f"_System of record endpoint: `{insight.adp_api_endpoint}`_"
            )
            res = await asyncio.to_thread(
                lambda: requests.post(
                    "https://slack.com/api/chat.postMessage",
                    headers={"Authorization": f"Bearer {bot_token}", "Content-Type": "application/json"},
                    json={"channel": channel_id, "thread_ts": ts, "text": reply_text},
                    timeout=5,
                ).json()
            )
            record["replied_in_slack"] = bool(res.get("ok"))
            if not res.get("ok"):
                print(f"[Slack] chat.postMessage failed: {res.get('error')}")
    except Exception as e:
        print(f"[Slack Event Error] {e}")


@app.post("/api/slack/events")
async def slack_events_webhook(payload: dict, background_tasks: BackgroundTasks):
    """
    Slack Events API webhook.
    1. Answers the Slack challenge when you first save the URL.
    2. For real messages, answers Slack right away and does the AI work in the background.
    """
    # 1. URL verification challenge from Slack app settings
    if payload.get("type") == "url_verification":
        return {"challenge": payload.get("challenge")}

    event = payload.get("event", {})

    # Ignore bot messages and edits so we never reply to ourselves
    if event.get("type") == "message" and not event.get("bot_id") and not event.get("subtype"):
        text = event.get("text", "")
        user_id = event.get("user", "EMP-SLACK-USER")
        channel_id = event.get("channel")
        ts = event.get("ts")

        key = f"{channel_id}-{ts}"
        if key in SEEN_SLACK_MESSAGES:
            return {"status": "duplicate"}
        SEEN_SLACK_MESSAGES.add(key)

        print(f"[Slack Event] Message from {user_id} in {channel_id}: '{text}'")
        background_tasks.add_task(process_slack_message, text, user_id, channel_id, ts)
        return {"status": "accepted"}

    # Raw payload fallback for testing without Slack
    if "message" in payload:
        insight, _sources = await synthesize_rag_insight(
            employee_id=payload.get("employee_id", "EMP-90421"),
            manager_id=payload.get("manager_id", "sarah-connor"),
            message=payload["message"],
            domain="hr"
        )
        return {"status": "success", "insight": insight.model_dump()}

    return {"status": "ignored"}


@app.get("/api/slack/feed")
def get_live_slack_feed():
    """
    Returns the latest messages and results for the dashboard in Live mode.
    (The name says Slack, but API calls from demo.ps1 show up here too.)
    """
    purge_old_done()
    return {"feed": LIVE_SLACK_FEED}


class DoneRequest(BaseModel):
    how: str = "manual"  # "adp" (sent to ADP) or "manual" (handled another way)


def find_feed_item(item_id: str) -> dict:
    for rec in LIVE_SLACK_FEED:
        if rec["id"] == item_id:
            return rec
    raise HTTPException(status_code=404, detail="Feed item not found")


@app.post("/api/slack/feed/{item_id}/done")
def mark_feed_item_done(item_id: str, body: DoneRequest):
    """Close a case once the manager has acted on it."""
    rec = find_feed_item(item_id)
    rec["status"] = "done"
    rec["done_at"] = datetime.now().isoformat(timespec="seconds")
    rec["done_how"] = "adp" if body.how == "adp" else "manual"
    save_feed()
    return {"status": "ok", "item": rec}


@app.post("/api/slack/feed/{item_id}/reopen")
def reopen_feed_item(item_id: str):
    """Undo a close, in case it was clicked by mistake."""
    rec = find_feed_item(item_id)
    rec["status"] = "open"
    rec["done_at"] = None
    rec["done_how"] = None
    save_feed()
    return {"status": "ok", "item": rec}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
