# Development Log - Export Pipeline
**Developer:** Usman Azhar  
**Module:** Backend - Document Export  
**Week:** 1  

---

## Day 1 - Understanding the Task (Dec 10, Evening)

### What I Learned Today
- Reviewed the project proposal and my assigned task
- My responsibility: Create export endpoints that convert structured data to PDF and Markdown files
- Had to learn what a "pipeline" actually means in backend development
- Researched FastAPI framework - it's like Flask but with automatic API documentation

### Initial Research
- Watched FastAPI tutorial: https://www.youtube.com/watch?v=7t2alSnE2-I
- Read ReportLab documentation for PDF generation
- Discussed with Hassan about the data structure his specification engine will produce

### Challenges
- Never worked with FastAPI before - the decorator syntax (@router.post) was confusing initially
- Didn't understand what "endpoints" meant - learned they're like doors that other programs knock on
- Confused about BytesIO vs regular file writing

### Questions I Asked
- Asked Maheen: "What's the difference between a router and the main app?"
- Asked Hassan: "What format will your specification data be in?"
- Searched: "How to return files from FastAPI endpoints"

---

## Day 2 - Basic Setup (Dec 11, Morning)

### What I Did
- Set up Python virtual environment (after trying to install globally and getting errors)
- Installed dependencies: FastAPI, Uvicorn, ReportLab, Pydantic
- Created basic project structure with `export_routes.py`
- Got the FastAPI server running successfully!

### Technical Decisions
**Why I chose BytesIO:**
- Initially thought I'd save PDF to disk then send it
- Maheen suggested BytesIO for better performance
- Makes sense now - creates file in memory, no cleanup needed

**Why separate routers:**
- Could put everything in main.py
- But using routers makes code more organized
- Easier for team integration later

### Code Progress
✅ FastAPI server runs without errors
✅ Basic endpoint structure created
✅ Pydantic models defined
⏳ Actual PDF generation logic still needed

### Errors I Fixed
```python
# Error 1: ImportError for reportlab
# Solution: pip install reportlab

# Error 2: CORS errors when testing
# Solution: Added CORS middleware (Maheen helped with this)
```

---

## Day 3 - PDF Implementation (Dec 11, Afternoon)

### Implementation Work
Started working on the actual PDF generation logic. ReportLab was harder than expected!

### Things That Worked
- Used SimpleDocTemplate - simpler than full PDF creation
- ParagraphStyle for custom formatting
- Elements list approach (add content, then build)

### Things That Didn't Work Initially
1. **Wrong approach:** Tried to manually position elements with coordinates
   - **Solution:** Use flowables instead - they auto-position

2. **Unicode errors:** Special characters breaking PDF
   - **Partial fix:** Using basic HTML tags in Paragraph
   - **Note:** Will need better solution for special characters later

3. **Spacing issues:** Everything was cramped together
   - **Solution:** Added Spacer elements between sections

### Code Snippet I'm Proud Of
```python
# This took me a while to figure out
for story in data.user_stories:
    if story.acceptance_criteria:  # Handle empty lists
        elements.append(Paragraph("<b>Acceptance Criteria:</b>", styles['Normal']))
        for criterion in story.acceptance_criteria:
            elements.append(Paragraph(f"• {criterion}", styles['Normal']))
```

---

## Day 4 - Markdown & Testing (Dec 12, Morning)

### Markdown Implementation
Much easier than PDF! Just string concatenation with proper formatting.

### Key Learnings
- Using list + join() instead of string += for better performance
- Following GitHub markdown standards (headers, bold, bullet points)
- Proper newline handling (\n vs \n\n)

### Testing Process
1. Created sample data matching Hassan's structure
2. Tested PDF export - worked first try! (surprising)
3. Tested Markdown export - had newline issue, fixed it
4. Tested with empty fields - found bug with acceptance_criteria

### Bug Fix
```python
# Bug: Crashed when user stories had no acceptance criteria
# Fix: Added check
if story.acceptance_criteria:
    # Only process if list is not empty
```

---

## Day 5 - Error Handling & Integration Prep (Dec 12, Afternoon)

### Improvements Made
- Added try-catch blocks to both endpoints
- Proper HTTPException handling with status codes
- Fixed filename sanitization (spaces → underscores)
- Added detailed docstrings for all functions

### Integration Coordination
Met with team to discuss integration:
- **Maheen:** Will include my router in main app
- **Hassan:** Confirmed data structure matches
- **Frontend team:** Showed them how to call endpoints

### Testing with Team
```bash
# Started server
python main.py

# Maheen tested from frontend mock
# Hassan sent me sample data from his AI output
# Everything worked!
```

---

## Week 1 - Summary & Reflection

### What I Accomplished ✅
- ✅ Created `/export/pdf` endpoint - fully functional
- ✅ Created `/export/markdown` endpoint - fully functional
- ✅ Both endpoints tested and working
- ✅ Error handling implemented
- ✅ Documentation added
- ✅ Ready for team integration

### Technical Skills Gained
1. **FastAPI:** Basic routing, routers, response types
2. **ReportLab:** PDF generation, flowables, styling
3. **Pydantic:** Data validation, models
4. **Python:** Type hints, async functions, exception handling

### Challenges Overcome
- Learning curve with FastAPI (steep at first)
- ReportLab documentation not beginner-friendly
- Understanding BytesIO concept
- CORS configuration for frontend integration

### What I'd Do Differently
- Should have started with markdown first (simpler)
- Could have asked more questions earlier
- Should have tested with edge cases sooner

### Next Steps (Week 2+)
- [ ] Add better PDF styling (colors, better fonts)
- [ ] Support for diagrams in exports
- [ ] HTML export format
- [ ] Batch export functionality
- [ ] Export templates for different project types

---

## Resources I Used
- FastAPI Official Docs: https://fastapi.tiangolo.com/
- ReportLab User Guide: https://www.reportlab.com/docs/reportlab-userguide.pdf
- Stack Overflow for specific error messages
- Team members: Maheen, Hassan, Dania

---

## Personal Notes
This was challenging but rewarding. First time building a real backend module that others will use. The feeling when the PDF downloaded correctly was amazing! 

Learned that it's okay to not know everything - asking questions and researching is part of development. Also learned that breaking big tasks into small steps makes everything more manageable.

Looking forward to Week 2 improvements!

---
**End of Week 1 Log**
