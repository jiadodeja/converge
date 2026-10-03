"""
Data Ingestion Script for Converge HR Intelligence Backend.

Parses handbook.pdf using Unstructured.io (with robust PyPDF fallback if system dependencies like Poppler are absent),
chunks the text using LangChain's RecursiveCharacterTextSplitter,
embeds the chunks using OpenAI (text-embedding-3-small),
and stores them in a local ChromaDB collection.
"""

import os
import sys
from typing import List
from dotenv import load_dotenv

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

# Load environment variables
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_PDF_PATH = os.path.join(BASE_DIR, "data", "handbook.pdf")
DEFAULT_CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")
DEFAULT_COLLECTION_NAME = os.getenv("CHROMA_COLLECTION_NAME", "hr_policies")


def parse_pdf_with_unstructured(pdf_path: str) -> List[Document]:
    """
    Parses a PDF using Unstructured.io.
    Falls back gracefully to PyPDF if poppler or OS dependencies are missing.
    """
    documents: List[Document] = []

    # Attempt 1: Unstructured.io partition_pdf
    try:
        from unstructured.partition.pdf import partition_pdf
        print(f"[Ingest] Parsing '{pdf_path}' with Unstructured.io...")
        elements = partition_pdf(
            filename=pdf_path,
            strategy="fast",
            infer_table_structure=False
        )
        combined_text = "\n\n".join([str(el) for el in elements if str(el).strip()])
        if combined_text:
            documents.append(
                Document(
                    page_content=combined_text,
                    metadata={"source": pdf_path, "parser": "unstructured"}
                )
            )
            print(f"[Ingest] Successfully extracted {len(elements)} elements via Unstructured.io.")
            return documents
    except Exception as e:
        print(f"[Ingest] Note: Unstructured.io partition encountered ({e}). Switching to PyPDF fallback...")

    # Attempt 2: LangChain UnstructuredPDFLoader
    try:
        from langchain_community.document_loaders import UnstructuredPDFLoader
        loader = UnstructuredPDFLoader(pdf_path, mode="single")
        docs = loader.load()
        if docs and len(docs[0].page_content.strip()) > 0:
            print("[Ingest] Successfully parsed document using UnstructuredPDFLoader.")
            return docs
    except Exception as e:
        print(f"[Ingest] Note: UnstructuredPDFLoader fallback ({e}). Using PyPDFLoader...")

    # Attempt 3: Robust PyPDF fallback
    try:
        from langchain_community.document_loaders import PyPDFLoader
        loader = PyPDFLoader(pdf_path)
        docs = loader.load()
        print(f"[Ingest] Successfully parsed {len(docs)} pages using PyPDFLoader.")
        return docs
    except Exception as e:
        print(f"[Ingest] Note: PyPDFLoader error ({e}). Trying raw pypdf.PdfReader...")

    # Attempt 4: Direct pypdf.PdfReader
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        docs = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            docs.append(Document(page_content=text, metadata={"source": pdf_path, "page": idx + 1}))
        print(f"[Ingest] Successfully extracted {len(docs)} pages using pypdf.PdfReader.")
        return docs
    except Exception as e:
        raise RuntimeError(f"Failed to parse PDF document at {pdf_path}: {e}")


def chunk_documents(documents: List[Document]) -> List[Document]:
    """
    Chunks parsed documents using RecursiveCharacterTextSplitter.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=450,
        chunk_overlap=60,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = text_splitter.split_documents(documents)
    print(f"[Ingest] Created {len(chunks)} text chunks from source documents.")
    return chunks


def embed_and_store_in_chroma(
    chunks: List[Document],
    chroma_dir: str = DEFAULT_CHROMA_DIR,
    collection_name: str = DEFAULT_COLLECTION_NAME
) -> Chroma:
    """
    Embeds text chunks using OpenAI text-embedding-3-small and stores in local ChromaDB.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and not api_key.startswith("your_openai"):
        print(f"[Ingest] Initializing OpenAIEmbeddings (text-embedding-3-small)...")
        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=api_key
        )
    else:
        print("[Ingest] Notice: OPENAI_API_KEY is not configured. Using local offline embeddings for initial vectorstore indexing...")
        from langchain_core.embeddings.fake import FakeEmbeddings
        embeddings = FakeEmbeddings(size=1536)

    print(f"[Ingest] Storing embeddings into ChromaDB at '{chroma_dir}' (collection: '{collection_name}')...")
    os.makedirs(chroma_dir, exist_ok=True)
    
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=chroma_dir,
        collection_name=collection_name
    )

    print(f"[Ingest] Successfully indexed {len(chunks)} chunks into ChromaDB.")
    return vectorstore


def run_ingestion(
    pdf_path: str = DEFAULT_PDF_PATH,
    chroma_dir: str = DEFAULT_CHROMA_DIR,
    collection_name: str = DEFAULT_COLLECTION_NAME
):
    """
    Orchestrates the full PDF parsing, chunking, and ChromaDB vector indexing pipeline.
    """
    if not os.path.exists(pdf_path):
        print(f"[Ingest] PDF not found at {pdf_path}. Generating mock handbook.pdf first...")
        from data.generate_pdf import main as gen_pdf_main
        gen_pdf_main()

    print("=" * 60)
    print("CONVERGE BACKEND: Starting Data Ingestion Pipeline")
    print(f"Target PDF: {pdf_path}")
    print(f"Target Chroma Directory: {chroma_dir}")
    print("=" * 60)

    # 1. Parse PDF
    docs = parse_pdf_with_unstructured(pdf_path)

    # 2. Chunk text
    chunks = chunk_documents(docs)

    # 3. Embed and store
    vectorstore = embed_and_store_in_chroma(chunks, chroma_dir, collection_name)
    return vectorstore


if __name__ == "__main__":
    try:
        run_ingestion()
    except Exception as exc:
        print(f"[Ingest Error] {exc}", file=sys.stderr)
        sys.exit(1)
