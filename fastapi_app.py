import os
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

DEBUG = os.getenv("DEBUG", "False") == "True"
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8000))
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
DATABASE_URL = os.getenv("DATABASE_URL", "")

app = FastAPI(title="SpecForge API", version="1.0.0")

class GenerateRequest(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: str = "active"

#this is generate endpoint where we receive project text and sent to ai module
@app.post("/generate")
async def generate(request: GenerateRequest):
    return {
        "status": "success",
        "message": f"Generated project: {request.name}",
        "data": request
    }

@app.get("/project/{id}")
async def get_project(id: str):
    return {
        "id": id,
        "name": f"Project-{id}",
        "description": "Sample project description",
        "status": "active"
    }

#this just tests that the project is running
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
