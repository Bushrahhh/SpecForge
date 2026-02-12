# Export Module - SpecForge
**Developer:** Usman Azhar  
**Status:** Week 1 Complete ✅  
**Last Updated:** December 12, 2024

## Overview
The Export Module provides document generation functionality for SpecForge. It converts structured specification data (requirements, tech stack, user stories) into downloadable PDF and Markdown formats.

## Architecture

```
Specification Data (JSON) → Export Router → Document Generator → File Download
```

## API Endpoints

### 1. PDF Export
**Endpoint:** `POST /export/pdf`  
**Description:** Generates a professionally formatted PDF document

**Request Body:**
```json
{
  "project_name": "SpecForge",
  "description": "AI-powered specification generator",
  "functional_requirements": [
    {
      "id": "FR-001",
      "description": "System shall accept text input",
      "priority": "High"
    }
  ],
  "non_functional_requirements": [...],
  "tech_stack": [...],
  "user_stories": [...]
}
```

**Response:**
- Content-Type: `application/pdf`
- Binary PDF file with download headers

**Example Usage (JavaScript):**
```javascript
const response = await fetch('/export/pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(specificationData)
});

const blob = await response.blob();
const url = URL.createObjectURL(blob);
// Trigger download
```

---

### 2. Markdown Export
**Endpoint:** `POST /export/markdown`  
**Description:** Generates a GitHub-compatible markdown document

**Request Body:** Same as PDF export

**Response:**
- Content-Type: `text/markdown`  
- Plain text markdown file

**Output Format:**
```markdown
# Project Name

## Project Description
...

## Functional Requirements
- **FR-001**: Description *(Priority: High)*

## User Stories
### US-001
As a **user**, I want **feature**, so that **benefit**
```

---

### 3. Health Check
**Endpoint:** `GET /export/test`  
**Description:** Verify export module is operational

**Response:**
```json
{
  "message": "Export pipeline is working!",
  "endpoints": [...],
  "developer": "Usman Azhar",
  "status": "operational"
}
```

## Data Models

### Requirement
```python
{
  "id": str,           # e.g., "FR-001"
  "description": str,   # Requirement text
  "priority": str      # "High", "Medium", "Low" (default: "Medium")
}
```

### TechStackItem
```python
{
  "category": str,     # e.g., "Frontend", "Backend"
  "technology": str    # e.g., "Next.js", "FastAPI"
}
```

### UserStory
```python
{
  "id": str,                        # e.g., "US-001"
  "role": str,                      # "Product Manager"
  "action": str,                    # "generate requirements"
  "benefit": str,                   # "save time"
  "acceptance_criteria": [str]      # List of criteria (optional)
}
```

## Technical Implementation

### PDF Generation
- **Library:** ReportLab 4.0.7
- **Method:** In-memory generation using BytesIO
- **Styling:** Custom ParagraphStyles for headings and content
- **Structure:** Flowable elements (Paragraphs, Spacers)

**Why BytesIO?**
- Faster than disk I/O
- No temporary file cleanup needed
- Better for concurrent requests

### Markdown Generation
- **Method:** String concatenation with list/join pattern
- **Format:** GitHub Flavored Markdown
- **Structure:** Hierarchical headings (H1, H2, H3)

## Setup & Installation

### Prerequisites
- Python 3.8+
- FastAPI
- ReportLab

### Installation
```bash
# Install dependencies
pip install -r requirements.txt

# Dependencies added:
# - reportlab==4.0.7
# - python-multipart==0.0.6
```

### Running
```bash
# Start the server (if running standalone)
python main.py

# Or integrate into main app:
from export.export_routes import router as export_router
app.include_router(export_router)
```

### Testing
```bash
# Visit API docs
http://localhost:8000/docs

# Test health check
curl http://localhost:8000/export/test
```

## Integration Guide

### For Backend Team (Maheen)
Include the router in your main FastAPI application:

```python
from export.export_routes import router as export_router

app = FastAPI()
app.include_router(export_router)
```

### For Specification Engine (Hassan)
Ensure your output matches the `SpecificationData` model:

```python
{
  "project_name": str,
  "description": str,
  "functional_requirements": List[Requirement],
  "non_functional_requirements": List[Requirement],
  "tech_stack": List[TechStackItem],
  "user_stories": List[UserStory]
}
```

### For Frontend Team (Hamza, Salman, Saim)
Call endpoints after getting specification from AI:

```javascript
// 1. Get specification from backend
const spec = await generateSpecification(projectInput);

// 2. Export as PDF
const pdfResponse = await fetch('/export/pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(spec)
});

// 3. Download file
const blob = await pdfResponse.blob();
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = 'specification.pdf';
link.click();
```

## Error Handling

Both endpoints include try-catch error handling:

```python
try:
    # Generate document
    ...
except Exception as e:
    raise HTTPException(
        status_code=500,
        detail=f"Error generating PDF: {str(e)}"
    )
```

**Common Errors:**
- **500 Internal Server Error:** Document generation failed
  - Check data structure matches models
  - Verify all required fields present

## Performance Considerations

### Current Performance
- Small documents (<10 pages): ~0.5 seconds
- Medium documents (10-50 pages): ~1-2 seconds
- Large documents (50+ pages): ~2-3 seconds

### Optimization Opportunities (Week 2+)
- Implement async PDF generation for large documents
- Add caching for repeated exports
- Batch processing for multiple exports

## Known Limitations

1. **PDF Styling:** Basic formatting only (Week 1 MVP)
   - Will enhance in Week 2 with better fonts, colors
   
2. **No Diagram Support:** Currently text-only
   - Pending integration with visualization team
   
3. **File Size:** No compression implemented yet
   - Will add for large documents in future

4. **Special Characters:** Some unicode characters may not render perfectly
   - ReportLab limitation - investigating solutions

## Future Enhancements

### Week 2+ Roadmap
- [ ] Enhanced PDF styling (colors, better fonts, logos)
- [ ] HTML export format
- [ ] Diagram integration in exports
- [ ] Custom templates (different project types)
- [ ] Batch export (multiple formats at once)
- [ ] Export history/versioning
- [ ] PDF page numbers and table of contents
- [ ] Watermark support

## Development Notes

### Lessons Learned
1. ReportLab uses a "flowable" approach - elements flow onto page
2. BytesIO is more efficient than file-based generation
3. Pydantic validation catches data issues early
4. Proper error handling is crucial for frontend integration

### Design Decisions
- **Separate router:** Better code organization, easier testing
- **Pydantic models:** Type safety, automatic validation
- **In-memory generation:** Performance over persistence
- **Simple first:** MVP focuses on functionality, not styling

## Testing

### Manual Testing Checklist
- [x] PDF generates successfully
- [x] Markdown generates successfully
- [x] Empty fields handled gracefully
- [x] Special characters in project names
- [x] Large documents (50+ requirements)
- [x] Missing optional fields (acceptance_criteria)
- [x] CORS works with frontend

### Test Data
Sample test data available in `test_export.py`

## Support & Questions

**Developer:** Usman Azhar  
**Team:** SpecForge Backend  
**Documentation:** See DEV_LOG.md for detailed development journey

---

## Quick Reference

```bash
# Test endpoints
GET  /export/test         # Health check
POST /export/pdf          # Generate PDF
POST /export/markdown     # Generate Markdown

# Response headers
Content-Disposition: attachment; filename=project_name_specification.pdf
Content-Type: application/pdf | text/markdown
```

---
**Week 1 Status: Complete ✅**  
All deliverables met: Export endpoints stubbed and callable.
