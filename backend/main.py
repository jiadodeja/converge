"""
Converge HR Copilot Backend API Server
FastAPI endpoint: POST /api/insights/generate
Integrates Unstructured/LangChain RAG, ChromaDB local vector store, and OpenAI GPT-4o.
"""

import os
import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
from typing import List, Optional
from dotenv import load_dotenv

from fastapi import BackgroundTasks, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_chroma import Chroma

from schemas import InsightRequest, HRActionPlan

# Load environment configuration
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIRECTORY", os.path.join(BASE_DIR, "chroma_db"))
COLLECTION_NAME = os.getenv("CHROMA_COLLECTION_NAME", "hr_policies")
PDF_PATH = os.getenv("PDF_PATH", os.path.join(BASE_DIR, "data", "handbook.pdf"))


# Global Vectorstore reference
vector_store: Optional[Chroma] = None


def get_vector_store() -> Chroma:
    """
    Initializes or returns the persistent Chroma vector store.
    """
    global vector_store
    if vector_store is not None:
        return vector_store

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key.startswith("your_openai"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "OPENAI_API_KEY is not configured. Please set a valid OpenAI API key in "
                "backend/.env to enable embeddings retrieval and GPT-4o synthesis."
            )
        )

    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        api_key=api_key
    )

    vector_store = Chroma(
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings
    )
    return vector_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown lifecycle handler.
    Checks PDF presence and environment readiness.
    """
    print("[FastAPI Startup] Initializing Converge Backend...")
    if not os.path.exists(PDF_PATH):
        print(f"[FastAPI Startup] Generating default handbook at {PDF_PATH}...")
        try:
            from data.generate_pdf import main as gen_pdf
            gen_pdf()
        except Exception as e:
            print(f"[FastAPI Startup] Error generating PDF: {e}")
    yield
    print("[FastAPI Shutdown] Converge Backend stopped.")


app = FastAPI(
    title="Converge HR Intelligence API",
    description="Transforms messy enterprise communications and policies into actionable HR insights and automated ADP payloads.",
    version="1.0.0",
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
        "service": "Converge Enterprise HR Intelligence API",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs",
        "endpoints": {
            "insights_generate": "POST /api/insights/generate",
            "health": "GET /health"
        }
    }


@app.get("/health")
def health_check():
    api_key_set = bool(os.getenv("OPENAI_API_KEY") and not os.getenv("OPENAI_API_KEY", "").startswith("your_openai"))
    chroma_exists = os.path.exists(CHROMA_DIR)
    pdf_exists = os.path.exists(PDF_PATH)

    return {
        "status": "healthy",
        "openai_api_key_configured": api_key_set,
        "chroma_dir_exists": chroma_exists,
        "handbook_pdf_exists": pdf_exists,
    }


SYSTEM_PROMPT = """You are "Converge", an enterprise HR Copilot and policy intelligence system built for front-line People Managers.
Your objective is to turn messy, ambiguous employee communications (e.g., Slack messages) into deterministic, verified HR action plans by cross-referencing corporate policies.

You will be given:
1. The employee's raw Slack message.
2. Verified excerpts from the official Enterprise Employee Handbook retrieved via semantic search.

Instructions:
- Carefully analyze the employee's request against the provided policy context.
- Determine the employee's eligibility, duration, compensation, and any statutory protections (such as FMLA or state PFL).
- Address any specific questions (e.g., whether PTO burn-down is mandatory or voluntary).
- Prescribe explicit, actionable next steps for the front-line people manager.
- Specify the appropriate mocked ADP Workforce Now REST API endpoint for automating this life event or policy workflow (e.g. "POST /events/hr/v1/leaves/parental-leave-requests" or "POST /events/hr/v1/benefits/pto-adjustments"). Do not call real APIs; provide a realistic mocked endpoint path.

You must output strictly conforming to the requested schema:
- eligibility_summary: Plain-English, comprehensive synthesis of what the employee is entitled to and relevant policy clauses.
- recommended_action: Step-by-step guidance for the front-line manager to resolve the request.
- adp_api_endpoint: The mocked ADP REST API endpoint string to record this action in the system of record.
- headline: One sentence saying what the employee is asking for.
- category: One of Parental Leave, Cross-Border Remote Work, Medical / FMLA, Equipment & Wellness Stipend, PTO Carryover, General HR Question.
- urgency: High, Medium or Low.
- eligibility_status: Eligible, Conditional or Ineligible.
- eligibility_headline: Very short label (max 8 words) of the result.
- key_points: 2 to 4 short bullets of the policy facts that apply.
- statutory_citation: The handbook section or law used. Leave empty if the context does not name one.
- checklist: 3 to 5 short manager action steps, in order.
- suggested_slack_reply: A friendly, short Slack reply the manager can send to the employee.
Only use facts that are in the policy context. If the context does not answer the question, say so and set eligibility_status to Conditional.
"""

USER_PROMPT_TEMPLATE = """Employee ID: {employee_id}
Manager ID: {manager_id}

[RAW SLACK MESSAGE FROM EMPLOYEE]:
"{message}"

[RETRIEVED POLICY CONTEXT FROM HANDBOOK]:
{context}
"""


# In-memory store for live Slack messages received during demo
LIVE_SLACK_FEED: List[dict] = []


async def synthesize_rag_insight(employee_id: str, manager_id: str, message: str) -> tuple:
    """
    Core RAG pipeline (returns the plan and the policy excerpts used):
    1. Embeds query & retrieves top 3 chunks from ChromaDB.
    2. Runs ChatOpenAI(model="gpt-4o") with structured output schema.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key.startswith("your_openai"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is not configured in backend/.env"
        )

    store = get_vector_store()
    retrieved_docs = store.similarity_search(query=message, k=3)

    context_texts = []
    for idx, doc in enumerate(retrieved_docs, start=1):
        context_texts.append(f"--- Document Chunk {idx} ---\n{doc.page_content.strip()}")

    context_block = "\n\n".join(context_texts) if context_texts else "No policy documents found in index."

    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0.0,
        api_key=api_key
    )
    structured_llm = llm.with_structured_output(HRActionPlan)

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("user", USER_PROMPT_TEMPLATE),
    ])

    chain = prompt | structured_llm

    result: HRActionPlan = await chain.ainvoke({
        "employee_id": employee_id,
        "manager_id": manager_id,
        "message": message,
        "context": context_block,
    })

    sources = []
    for doc in retrieved_docs:
        page = doc.metadata.get("page")
        sources.append({
            "text": doc.page_content.strip(),
            "page": page + 1 if isinstance(page, int) else None,
        })

    return result, sources


@app.post("/api/insights/generate", response_model=HRActionPlan)
async def generate_insight(payload: InsightRequest):
    """
    Direct RAG synthesis endpoint invoked by frontend or external clients.
    """
    try:
        result, sources = await synthesize_rag_insight(
            employee_id=payload.employee_id,
            manager_id=payload.manager_id,
            message=payload.message
        )
        
        # Also record in live feed for dashboard streaming
        LIVE_SLACK_FEED.append({
            "id": f"evt-{len(LIVE_SLACK_FEED) + 1}",
            "employee_id": payload.employee_id,
            "manager_id": payload.manager_id,
            "message": payload.message,
            "insight": result.model_dump(),
            "sources": sources,
            "received_at": datetime.now().isoformat(timespec="seconds"),
            "timestamp": "Just now",
            "source": "api"
        })

        return result
    except HTTPException:
        raise
    except Exception as exc:
        print(f"[Error in generate_insight] {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating insight: {str(exc)}"
        )


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
            message=text
        )

        user_name = await asyncio.to_thread(get_slack_user_name, user_id, bot_token)

        record = {
            "id": f"slack-{ts}",
            "employee_id": user_id,
            "employee_name": user_name,
            "manager_id": "sarah-connor",
            "channel_id": channel_id,
            "message": text,
            "insight": insight.model_dump(),
            "sources": sources,
            "received_at": datetime.now().isoformat(timespec="seconds"),
            "timestamp": "Just now",
            "source": "slack_webhook",
            "replied_in_slack": False,
        }
        LIVE_SLACK_FEED.append(record)

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
        insight, sources = await synthesize_rag_insight(
            employee_id=payload.get("employee_id", "EMP-90421"),
            manager_id=payload.get("manager_id", "sarah-connor"),
            message=payload["message"]
        )
        return {"status": "success", "insight": insight.model_dump()}

    return {"status": "ignored"}


@app.get("/api/slack/feed")
def get_live_slack_feed():
    """
    Returns the feed of live Slack messages and synthesized insights for real-time dashboard updates.
    """
    return {"feed": LIVE_SLACK_FEED[-20:]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
