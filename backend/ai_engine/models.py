from pydantic import BaseModel
from typing import List, Optional

class Requirement(BaseModel):
    description: str
    type: str  # "Functional" or "Non-Functional"
    confidence: Optional[float] = 1.0

class Entity(BaseModel):
    name: str
    type: str  # "Actor", "System", "External"

class ExtractedData(BaseModel):
    requirements: List[Requirement]
    entities: List[Entity]
    actions: List[str]
    constraints: List[str]
