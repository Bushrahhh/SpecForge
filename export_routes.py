"""
Export Pipeline for SpecForge
Author: Usman Azhar
Week 1 Deliverable: Export endpoints stubbed and callable

This module handles document export functionality. It takes structured
specification data (requirements, tech stack, user stories) and converts
them into downloadable formats.

Learning Notes:
- First time working with FastAPI and ReportLab
- BytesIO was confusing at first but makes sense now (in-memory files)
- Pydantic models ensure data validation automatically

Endpoints:
1. /export/pdf - Generates a formatted PDF document
2. /export/markdown - Generates a GitHub-compatible markdown file
3. /export/test - Simple health check to verify module is working
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO

# Create router for export-related endpoints
router = APIRouter(prefix="/export", tags=["export"])


# ============================================
# DATA MODELS
# ============================================
# These match what Hassan is building in the specification engine
# We coordinated on this structure to ensure compatibility

class Requirement(BaseModel):
    """Represents a functional or non-functional requirement"""
    id: str
    description: str
    priority: Optional[str] = "Medium"


class TechStackItem(BaseModel):
    """Represents a technology recommendation"""
    category: str  # e.g., "Frontend", "Backend", "Database"
    technology: str


class UserStory(BaseModel):
    """Represents an agile user story with acceptance criteria"""
    id: str
    role: str  # "As a..."
    action: str  # "I want..."
    benefit: str  # "So that..."
    acceptance_criteria: List[str] = []


class SpecificationData(BaseModel):
    """Complete specification data container"""
    project_name: str
    description: str
    functional_requirements: List[Requirement]
    non_functional_requirements: List[Requirement]
    tech_stack: List[TechStackItem]
    user_stories: List[UserStory]


# ============================================
# PDF EXPORT ENDPOINT
# ============================================
@router.post("/pdf")
async def export_pdf(data: SpecificationData):
    """
    Generates a PDF document from specification data
    
    Uses ReportLab library to create a professionally formatted PDF.
    The PDF includes all sections: requirements, tech stack, and user stories.
    
    Returns: Binary PDF file with appropriate headers for download
    """
    
    try:
        # Using BytesIO to create PDF in memory instead of saving to disk
        # This is faster and cleaner - no need to manage temporary files
        # Learned this from FastAPI best practices documentation
        buffer = BytesIO()
        
        # Create the PDF document
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        
        # Container for PDF elements (ReportLab uses "flowable" objects)
        elements = []
        
        # Get default styles
        styles = getSampleStyleSheet()
        
        # Create custom styles for better formatting
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
        )
        
        # Add title
        elements.append(Paragraph(data.project_name, title_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Add description
        elements.append(Paragraph("Project Description", heading_style))
        elements.append(Paragraph(data.description, styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Add Functional Requirements
        elements.append(Paragraph("Functional Requirements", heading_style))
        for req in data.functional_requirements:
            req_text = f"<b>{req.id}:</b> {req.description} (Priority: {req.priority})"
            elements.append(Paragraph(req_text, styles['Normal']))
            elements.append(Spacer(1, 0.1*inch))
        elements.append(Spacer(1, 0.2*inch))
        
        # Add Non-Functional Requirements
        elements.append(Paragraph("Non-Functional Requirements", heading_style))
        for req in data.non_functional_requirements:
            req_text = f"<b>{req.id}:</b> {req.description} (Priority: {req.priority})"
            elements.append(Paragraph(req_text, styles['Normal']))
            elements.append(Spacer(1, 0.1*inch))
        elements.append(Spacer(1, 0.2*inch))
        
        # Add Technology Stack
        elements.append(Paragraph("Technology Stack", heading_style))
        for tech in data.tech_stack:
            tech_text = f"<b>{tech.category}:</b> {tech.technology}"
            elements.append(Paragraph(tech_text, styles['Normal']))
            elements.append(Spacer(1, 0.1*inch))
        elements.append(Spacer(1, 0.2*inch))
        
        # Add User Stories
        elements.append(Paragraph("User Stories", heading_style))
        for story in data.user_stories:
            story_text = f"<b>{story.id}:</b> As a {story.role}, I want {story.action}, so that {story.benefit}"
            elements.append(Paragraph(story_text, styles['Normal']))
            
            # This was tricky - needed to handle the case where acceptance_criteria might be empty
            if story.acceptance_criteria:
                elements.append(Paragraph("<b>Acceptance Criteria:</b>", styles['Normal']))
                for criterion in story.acceptance_criteria:
                    elements.append(Paragraph(f"• {criterion}", styles['Normal']))
            
            elements.append(Spacer(1, 0.15*inch))
        
        # Build the PDF
        doc.build(elements)
        
        # Get the PDF data from buffer
        pdf_data = buffer.getvalue()
        buffer.close()
        
        # Return as downloadable file
        # The filename sanitization (replacing spaces with underscores) was important
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={data.project_name.replace(' ', '_')}_specification.pdf"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")


# ============================================
# MARKDOWN EXPORT ENDPOINT
# ============================================
@router.post("/markdown")
async def export_markdown(data: SpecificationData):
    """
    Generates a Markdown document from specification data
    
    Markdown is simpler than PDF - just string concatenation with proper formatting.
    Makes sure to follow GitHub markdown standards for compatibility.
    
    Returns: Text file in markdown format
    """
    
    try:
        # Build markdown content as a list of strings
        # Using a list and join() is more efficient than repeated string concatenation
        markdown_content = []
        
        # Title
        markdown_content.append(f"# {data.project_name}\n")
        
        # Description
        markdown_content.append("## Project Description\n")
        markdown_content.append(f"{data.description}\n\n")
        
        # Functional Requirements
        markdown_content.append("## Functional Requirements\n")
        for req in data.functional_requirements:
            markdown_content.append(f"- **{req.id}**: {req.description} *(Priority: {req.priority})*\n")
        markdown_content.append("\n")
        
        # Non-Functional Requirements
        markdown_content.append("## Non-Functional Requirements\n")
        for req in data.non_functional_requirements:
            markdown_content.append(f"- **{req.id}**: {req.description} *(Priority: {req.priority})*\n")
        markdown_content.append("\n")
        
        # Technology Stack
        markdown_content.append("## Technology Stack\n")
        for tech in data.tech_stack:
            markdown_content.append(f"- **{tech.category}**: {tech.technology}\n")
        markdown_content.append("\n")
        
        # User Stories
        markdown_content.append("## User Stories\n")
        for story in data.user_stories:
            markdown_content.append(f"### {story.id}\n")
            markdown_content.append(f"As a **{story.role}**, I want **{story.action}**, so that **{story.benefit}**\n\n")
            
            if story.acceptance_criteria:
                markdown_content.append("**Acceptance Criteria:**\n")
                for criterion in story.acceptance_criteria:
                    markdown_content.append(f"- {criterion}\n")
                markdown_content.append("\n")
        
        # Combine all parts
        final_markdown = "".join(markdown_content)
        
        # Return as downloadable file
        return Response(
            content=final_markdown,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename={data.project_name.replace(' ', '_')}_specification.md"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating Markdown: {str(e)}")


# ============================================
# HEALTH CHECK ENDPOINT
# ============================================
@router.get("/test")
async def test_export():
    """
    Simple health check endpoint to verify the export module is working
    
    This is useful for debugging and for the frontend team to check
    if the export service is available before making actual export requests.
    """
    return {
        "message": "Export pipeline is working!",
        "endpoints": [
            "/export/pdf - POST request with specification data",
            "/export/markdown - POST request with specification data"
        ],
        "developer": "Usman Azhar",
        "status": "operational"
    }
