import re
from typing import Dict, List
from .models import ExtractedData, Requirement, Entity

class RequirementExtractor:
    def __init__(self):
        # Basic keywords for classification
        self.non_functional_keywords = [
            'secure', 'fast', 'performant', 'scalable', 'reliable', 'responsive',
            'encrypt', 'compliant', 'latency', 'uptime', 'availability', 'maintainable'
        ]
        
        # Patterns for entity extraction (heuristic based)
        self.actor_indicators = [
            r'\b(?:User|Admin|Customer|Client|Manager|System|Developer|Guest|Visitor)s?\b',
            r'\b(?:actors?|roles?)\b'
        ]

    def classify_requirement(self, text: str) -> str:
        """Determines if a requirement is Functional or Non-Functional based on keywords."""
        text_lower = text.lower()
        for keyword in self.non_functional_keywords:
            if keyword in text_lower:
                return "Non-Functional"
        return "Functional"

    def extract(self, text: str) -> ExtractedData:
        """Main method to parse text and return structured data."""
        
        # 1. Split text into potential requirement lines
        # This is a naive split; in production, use sentence tokenization
        lines = [line.strip() for line in re.split(r'[.\n]', text) if len(line.strip()) > 10]
        
        requirements = []
        entities_set = set()
        actions = []
        constraints = []

        for line in lines:
            # Requirements Classification
            req_type = self.classify_requirement(line)
            requirements.append(Requirement(description=line, type=req_type))
            
            # Constraint Detection
            if any(w in line.lower() for w in ['must', 'should', 'contraint', 'limit']):
                constraints.append(line)

            # Actor/Entity Extraction
            for pattern in self.actor_indicators:
                matches = re.findall(pattern, line, re.IGNORECASE)
                for match in matches:
                    # clean up pluralization loosely
                    entity_name = match.strip()
                    if entity_name.lower().endswith('s') and len(entity_name) > 1:
                         entity_name = entity_name[:-1] # naive singularization
                    entities_set.add(entity_name.capitalize())

            # Action Extraction (Simple verb heuristic - usually fails without NLP lib, 
            # so we'll look for common action verbs or phrases)
            action_verbs = ['login', 'register', 'view', 'create', 'update', 'delete', 'manage', 'generate', 'export']
            for verb in action_verbs:
                if verb in line.lower():
                    actions.append(f"{verb} functionality found in: \"{line[:30]}...\"")

        # Create Entity objects
        actor_keywords = ["User", "Admin", "Customer", "Client", "Manager", "Developer", "Guest", "Visitor"]
        entities = []
        for name in entities_set:
            entity_type = "System"
            for kw in actor_keywords:
                if kw in name:
                    entity_type = "Actor"
                    break
            entities.append(Entity(name=name, type=entity_type))

        return ExtractedData(
            requirements=requirements,
            entities=entities,
            actions=list(set(actions)), # dedup
            constraints=constraints
        )

# Helper function for easy import
def extract_requirements(text: str) -> Dict:
    extractor = RequirementExtractor()
    data = extractor.extract(text)
    return data.dict()
