import os
from openai import OpenAI
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv
from app.ai.prompts import SYSTEM_PROMPT

# Load environment variables from .env file
load_dotenv()

# Initialize the OpenAI client pointing to GitHub Models for free student access
client = OpenAI(
    base_url="https://models.inference.ai.azure.com",
    api_key=os.getenv("GITHUB_TOKEN")
)

class Entity(BaseModel):
    name: str
    attributes: List[str]

class TechStack(BaseModel):
    frontend: List[str]
    backend: List[str]
    database: List[str]
    other: List[str]

class ProjectSpec(BaseModel):
    """
    Data model for the structured project specification output.
    Ensures consistency across backend and frontend modules.
    """
    functional_requirements: List[str]
    non_functional_requirements: List[str]
    entities: List[Entity]
    tech_stack_suggestions: TechStack

def generate_specification(user_prompt: str):
    """
    Generates a structured project specification using LLM.
    Uses Beta Chat Completions Parse for guaranteed schema adherence.
    """
    try:
        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            response_format=ProjectSpec,
        )
        return response.choices[0].message.parsed
    except Exception as e:
        print(f"Error generating specification: {e}")
        return None