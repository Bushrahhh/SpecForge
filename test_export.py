"""
Test Suite for Export Pipeline
Author: Usman Azhar
Purpose: Automated testing for PDF and Markdown export endpoints

Run this file to verify both export endpoints are working correctly.
Make sure the FastAPI server is running before testing.
"""

import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

# Sample specification data for testing
SAMPLE_DATA = {
    "project_name": "SpecForge Test Project",
    "description": "An AI-powered application to generate software specifications automatically from natural language input.",
    "functional_requirements": [
        {
            "id": "FR-001",
            "description": "System shall accept text input from users describing their project idea",
            "priority": "High"
        },
        {
            "id": "FR-002",
            "description": "System shall generate structured requirements from unstructured input",
            "priority": "High"
        },
        {
            "id": "FR-003",
            "description": "System shall provide export functionality for PDF and Markdown formats",
            "priority": "Medium"
        }
    ],
    "non_functional_requirements": [
        {
            "id": "NFR-001",
            "description": "System shall respond to user inputs within 3 seconds",
            "priority": "High"
        },
        {
            "id": "NFR-002",
            "description": "System shall be available 99.9% of the time",
            "priority": "Medium"
        }
    ],
    "tech_stack": [
        {
            "category": "Frontend",
            "technology": "Next.js with TailwindCSS"
        },
        {
            "category": "Backend",
            "technology": "FastAPI with Python 3.11"
        },
        {
            "category": "Database",
            "technology": "PostgreSQL"
        },
        {
            "category": "AI/NLP",
            "technology": "OpenAI GPT-4 API"
        }
    ],
    "user_stories": [
        {
            "id": "US-001",
            "role": "Product Manager",
            "action": "input a project description in natural language",
            "benefit": "I can quickly get structured requirements without manual documentation",
            "acceptance_criteria": [
                "Text input field accepts minimum 100 characters",
                "System validates input before processing",
                "User receives confirmation when submission is successful"
            ]
        },
        {
            "id": "US-002",
            "role": "Developer",
            "action": "export specifications as a PDF document",
            "benefit": "I can share documentation with stakeholders",
            "acceptance_criteria": [
                "PDF contains all specification sections",
                "PDF is properly formatted and readable",
                "Download starts automatically upon request"
            ]
        }
    ]
}


def test_health_check():
    """Test the health check endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Health Check Endpoint")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/export/test", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed!")
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect. Is the server running on http://localhost:8000?")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_pdf_export():
    """Test the PDF export endpoint"""
    print("\n" + "="*60)
    print("TEST 2: PDF Export")
    print("="*60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/export/pdf",
            json=SAMPLE_DATA,
            timeout=10
        )
        
        if response.status_code == 200:
            with open("test_output.pdf", "wb") as f:
                f.write(response.content)
            
            print("✅ PDF export successful!")
            print(f"   File saved: test_output.pdf")
            print(f"   Size: {len(response.content):,} bytes")
            return True
        else:
            print(f"❌ PDF export failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_markdown_export():
    """Test the Markdown export endpoint"""
    print("\n" + "="*60)
    print("TEST 3: Markdown Export")
    print("="*60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/export/markdown",
            json=SAMPLE_DATA,
            timeout=10
        )
        
        if response.status_code == 200:
            with open("test_output.md", "w", encoding="utf-8") as f:
                f.write(response.text)
            
            print("✅ Markdown export successful!")
            print(f"   File saved: test_output.md")
            print(f"   Size: {len(response.text):,} characters")
            return True
        else:
            print(f"❌ Markdown export failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    print("\n" + "="*60)
    print("EXPORT PIPELINE TEST SUITE")
    print("Developer: Usman Azhar")
    print("="*60)
    print("\nMake sure server is running: python main.py")
    input("Press Enter to start testing...")
    
    results = []
    results.append(test_health_check())
    results.append(test_pdf_export())
    results.append(test_markdown_export())
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    passed = sum(results)
    total = len(results)
    print(f"\nPassed: {passed}/{total}")
    
    if passed == total:
        print("\n✅ ALL TESTS PASSED!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
    print("="*60 + "\n")
