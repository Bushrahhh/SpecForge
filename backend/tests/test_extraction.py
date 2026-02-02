import sys
import os
import json

# Add the project root to the python path so we can import backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from backend.ai_engine.extraction import extract_requirements

def test_basic_extraction():
    print("Testing Basic Extraction...")
    sample_text = """
    The system should allow Users to login securely.
    Admins must be able to view all orders.
    The application must be fast and responsive.
    Guests can browse the menu but cannot order.
    Data must be encrypted at rest.
    """
    
    result = extract_requirements(sample_text)
    
    # Print pretty JSON
    print(json.dumps(result, indent=2))
    
    # Basic Assertions
    requirements = result['requirements']
    entities = result['entities']
    
    assert len(requirements) >= 4, "Should extract at least 4 requirements"
    
    # Check for specific entities
    entity_names = [e['name'] for e in entities]
    print(f"Entities Found: {entity_names}")
    assert "User" in entity_names
    assert "Admin" in entity_names
    
    # Check for Functional vs Non-Functional
    func_reqs = [r for r in requirements if r['type'] == 'Functional']
    non_func_reqs = [r for r in requirements if r['type'] == 'Non-Functional']
    
    print(f"Functional Reqs: {len(func_reqs)}")
    print(f"Non-Functional Reqs: {len(non_func_reqs)}")
    
    assert len(func_reqs) > 0
    assert len(non_func_reqs) > 0
    
    print("Test Passed!")

if __name__ == "__main__":
    try:
        test_basic_extraction()
    except AssertionError as e:
        print(f"Test Failed: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
