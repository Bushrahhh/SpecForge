from pydantic import BaseModel, Field
from typing import List, Optional
from pydantic import ValidationError
import json

class FunctionalRequirement(BaseModel):
    id: int = Field(..., description="Unique ID for the requirement")
    feature: str = Field(..., description="Name of the feature")
    description: str = Field(..., description="Detailed behavior of the feature")
    priority: str = Field("Medium", pattern="^(High|Medium|Low)$")

class NonFunctionalRequirement(BaseModel):
    category: str = Field(..., description="e.g., Security, Performance")
    description: str = Field(..., description="The standard or limit to be met")

class TechStack(BaseModel):
    category: str = Field(..., description="e.g., Frontend, Database, Backend")
    framework: str = Field(..., description="The suggested tool (e.g., FastAPI, Next.js)")
    reasoning: Optional[str] = Field(None, description="Why this tool is suitable")

class UserStory(BaseModel):
    role: str = Field(..., description="As a [role]...")
    action: str = Field(..., description="I want to [action]...")
    benefit: str = Field(..., description="So that [benefit]...")
    acceptance_criteria: List[str] = Field(default_factory=list)

class ProjectSpecification(BaseModel):
    title: str
    functional_requirements: List[FunctionalRequirement]
    non_functional_requirements: List[NonFunctionalRequirement]
    tech_stack: List[TechStack]
    user_stories: List[UserStory]

def transformer(raw_ai_text:str) -> ProjectSpecification:
    try:
        clean_text = raw_ai_text.strip().replace("```json", "").replace("```", "")
        data_dict = json.loads(clean_text)
        structured_data = ProjectSpecification(**data_dict)
        return structured_data

    except json.JSONDecodeError:
        print("Error: AI output was not valid JSON.")
        raise
    except ValidationError as e:
        print(f"Error: AI output did not match the required schema: {e}")
        raise


