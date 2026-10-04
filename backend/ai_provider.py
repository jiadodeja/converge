"""
One place to choose the AI provider (Gemini or OpenAI).

Pick it in backend/.env with AI_PROVIDER=gemini  (or openai).
main.py and ingest.py both use these helpers, so the choice only lives here.
"""

import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

PROVIDER = os.getenv("AI_PROVIDER", "gemini").strip().lower()

# Model names can be changed in .env if Google or OpenAI rename them
GEMINI_CHAT_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-3.8-flash")
GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "models/gemini-embedding-001")
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


def key_env_name() -> str:
    return "OPENAI_API_KEY" if PROVIDER == "openai" else "GOOGLE_API_KEY"


def get_api_key() -> Optional[str]:
    """Returns the key for the chosen provider, or None if missing or still a placeholder."""
    key = os.getenv(key_env_name(), "").strip()
    if not key or key.startswith("your_"):
        return None
    return key


def chat_model_name() -> str:
    return OPENAI_CHAT_MODEL if PROVIDER == "openai" else GEMINI_CHAT_MODEL


def embedding_model_name() -> str:
    return OPENAI_EMBEDDING_MODEL if PROVIDER == "openai" else GEMINI_EMBEDDING_MODEL


def get_collection_name(domain: str = "hr") -> str:
    """
    Each business (domain) and each provider gets its own ChromaDB collection,
    for example hr_policies_gemini or payroll_policies_gemini.
    Embeddings from different models do not mix, so this avoids size mismatch errors.
    """
    return f"{domain}_policies_{PROVIDER}"


def get_embeddings():
    key = get_api_key()
    if PROVIDER == "openai":
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(model=OPENAI_EMBEDDING_MODEL, api_key=key)
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    return GoogleGenerativeAIEmbeddings(model=GEMINI_EMBEDDING_MODEL, google_api_key=key)


def get_llm():
    key = get_api_key()
    if PROVIDER == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model=OPENAI_CHAT_MODEL, temperature=0.0, api_key=key)
    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(model=GEMINI_CHAT_MODEL, temperature=0.0, google_api_key=key)
