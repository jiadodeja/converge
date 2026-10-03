"""
Automated test and verification script for Converge backend.
Tests:
1. Health check endpoint (GET /health)
2. Schema validation on POST /api/insights/generate
3. End-to-end RAG retrieval & GPT-4o synthesis (when OPENAI_API_KEY is configured)
"""

import os
import sys
import json
from dotenv import load_dotenv

load_dotenv()

def test_endpoints():
    try:
        from fastapi.testclient import TestClient
        from main import app
    except ImportError as e:
        print(f"[Test Error] Required dependencies not installed: {e}")
        print("Run: pip install -r requirements.txt")
        return

    client = TestClient(app)

    print("\n--- 1. Testing Root & Health Check ---")
    res_root = client.get("/")
    print(f"GET / -> Status {res_root.status_code}")
    print(json.dumps(res_root.json(), indent=2))
    assert res_root.status_code == 200

    res_health = client.get("/health")
    print(f"\nGET /health -> Status {res_health.status_code}")
    print(json.dumps(res_health.json(), indent=2))
    assert res_health.status_code == 200

    print("\n--- 2. Testing Payload Schema Validation ---")
    # Missing required field 'message'
    bad_payload = {"employee_id": "EMP-100", "manager_id": "MGR-200"}
    res_bad = client.post("/api/insights/generate", json=bad_payload)
    print(f"POST /api/insights/generate (invalid payload) -> Status {res_bad.status_code}")
    assert res_bad.status_code == 422
    print("Schema validation correctly rejected missing message.")

    print("\n--- 3. Testing RAG Insight Generation ---")
    valid_payload = {
        "employee_id": "EMP-90421",
        "manager_id": "MGR-1001",
        "message": "Hey Sarah, expecting our second kid in August! Do I get 12 weeks of leave, and do I have to exhaust my PTO first?"
    }

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key.startswith("your_openai"):
        print("\n[Notice] OPENAI_API_KEY is not configured yet in .env.")
        res_key_check = client.post("/api/insights/generate", json=valid_payload)
        print(f"POST /api/insights/generate -> Status {res_key_check.status_code}")
        print(f"Response: {res_key_check.json()}")
        assert res_key_check.status_code == 503
        print("API correctly handles unconfigured API key with clear 503 guidance.")
    else:
        print(f"Executing full RAG with OPENAI_API_KEY on payload: {valid_payload['message']}")
        res_gen = client.post("/api/insights/generate", json=valid_payload)
        print(f"POST /api/insights/generate -> Status {res_gen.status_code}")
        print(json.dumps(res_gen.json(), indent=2))
        assert res_gen.status_code == 200
        data = res_gen.json()
        assert "eligibility_summary" in data
        assert "recommended_action" in data
        assert "adp_api_endpoint" in data
        print("\nE2E RAG Pipeline Passed Successfully!")

if __name__ == "__main__":
    test_endpoints()
