# Converge Backend: HR Copilot & Policy RAG API

This is the Python FastAPI backend for **Converge**, an enterprise HR intelligence platform built for front-line People Managers. It ingests messy enterprise policy PDFs into a local ChromaDB vector store and serves a structured RAG synthesis endpoint powered by LangChain and OpenAI (`gpt-4o`).

---

## Architecture Overview

1. **Ingestion (`ingest.py`)**:
   - Parses `data/handbook.pdf` using **Unstructured.io** (with automated **PyPDF** fallback).
   - Splits document using LangChain's `RecursiveCharacterTextSplitter`.
   - Embeds policy chunks with `text-embedding-3-small`.
   - Indexes embeddings in local persistent **ChromaDB** (`./chroma_db`).

2. **Serving & Synthesis (`main.py`)**:
   - Framework: **FastAPI** with CORS enabled for the Next.js frontend (`http://localhost:3000`).
   - Endpoint: `POST /api/insights/generate`
   - Retrieves the top 3 relevant policy excerpts from ChromaDB.
   - Synthesizes an actionable HR plan using **GPT-4o** with LangChain structured output.
   - Mocks the target **ADP Workforce Now REST API** endpoint string.

---

## Quickstart Guide

### 1. Setup Environment & Install Dependencies

Navigate to the `backend` directory:
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Your OpenAI API Key

Copy the example environment file and add your OpenAI API key:
```bash
cp .env.example .env
```
Edit `.env`:
```ini
OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here
CHROMA_PERSIST_DIRECTORY=./chroma_db
CHROMA_COLLECTION_NAME=hr_policies
PDF_PATH=./data/handbook.pdf
```

### 3. Generate Mock PDF & Run Ingestion

Generate the 2-page mock employee handbook (`data/handbook.pdf`) containing FMLA and PTO rules:
```bash
python data/generate_pdf.py
```

Run the vector ingestion script to chunk, embed, and store the policies in ChromaDB:
```bash
python ingest.py
```

### 4. Start the FastAPI Server

Launch the development server with live reload:
```bash
python main.py
# Or via uvicorn directly:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## API Reference

### `POST /api/insights/generate`

#### Request Body:
```json
{
  "employee_id": "EMP-90421",
  "manager_id": "MGR-1001",
  "message": "Hey Sarah, expecting our second kid in August! Do I get 12 weeks of leave, and do I have to exhaust my PTO first?"
}
```

#### Response Body:
```json
{
  "eligibility_summary": "Under Section 4.2 of the Employee Handbook, the employee is eligible for up to 12 weeks of fully subsidized employer parental bonding leave at 100% of standard base salary. Under Section 5.2, PTO burn-down is voluntary and not mandatory; the employee is not required to exhaust accrued PTO days prior to commencing parental leave.",
  "recommended_action": "1. Confirm the employee's expected leave start date. 2. Verify tenured status in Workday (>12 months). 3. Inform the employee that their 18 accrued PTO days remain protected. 4. Submit the approved parental leave schedule via the ADP integration.",
  "adp_api_endpoint": "POST /events/hr/v1/leaves/parental-leave-requests"
}
```

---

## Testing & Verification

Run the automated endpoint test suite:
```bash
python test_api.py
```


---

## Multiple businesses (HR, Payroll, Insurance, Retirement)

Converge now works for four ADP business lines. Each one has its own sample policy PDF, its own
ChromaDB collection and its own AI instructions. The settings live in `domains.py`.

| Business | `domain` value | Sample document |
|---|---|---|
| HR | `hr` | `data/handbook.pdf` |
| Payroll | `payroll` | `data/payroll_guide.pdf` |
| Insurance | `insurance` | `data/benefits_guide.pdf` |
| Retirement | `retirement` | `data/retirement_plan.pdf` |

All documents are made-up sample text, not real ADP or legal rules.

### Setup after pulling this change
```bash
pip install -r requirements.txt
python data/generate_pdf.py      # only makes PDFs that are missing
python ingest.py                 # indexes all four businesses (or: python ingest.py payroll)
python main.py
```

### Endpoints
- `POST /api/insights/generate` takes `domain` (default `hr`) and returns one plan.
- `POST /api/insights/analyze-all` lets the AI pick every business the message touches and returns one plan for each.

### Demo script
```powershell
.\demo.ps1                    # menu
.\demo.ps1 -Domain payroll    # one business
.\demo.ps1 -Domain all        # one message, every business
```
Every call also shows up on the dashboard when it is in Live mode.

### AI provider
Set `AI_PROVIDER=gemini` (default) or `openai` in `.env`. See `ai_provider.py`.

### Add a new business
1. Add an entry to `DOMAINS` in `domains.py`.
2. Add its sample document text in `data/generate_pdf.py`.
3. Run `python ingest.py <name>`.
