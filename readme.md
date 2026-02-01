# SpecForge – Knowledge Graph Draft Module

Standalone Python module for the **Knowledge Graph Draft** (SpecForge MVP). It converts AI-extracted entities and interactions into a **graph-ready JSON structure** (nodes + edges) and optionally **Mermaid.js flowchart syntax** for diagram rendering.

- **Scope:** Week 1 MVP – no UI, no database, no API server.
- **Constraints:** Python 3.10+, standard library only.

---

## Input Contract

The module expects a Python `dict` with:

| Key           | Type     | Description                                      |
|---------------|----------|--------------------------------------------------|
| `entities`    | list[str]| Entity names (e.g. User, WebApp, API, Database) |
| `interactions`| list[str]| Natural-language relations (e.g. "User uses WebApp") |

**Example input:**

```json
{
  "entities": ["User", "WebApp", "API", "Database", "PaymentGateway"],
  "interactions": [
    "User uses WebApp",
    "WebApp calls API",
    "API reads/writes Database",
    "API integrates PaymentGateway"
  ]
}
```

---

## Output Contract

The module returns a graph object:

| Key     | Type  | Description |
|---------|-------|-------------|
| `nodes` | list  | Each item: `{"id": "<string>", "type": "<node_type>"}` |
| `edges` | list  | Each item: `{"from": "<id>", "to": "<id>", "relation": "<relation>"}` |

**Node types (controlled vocabulary):**  
`actor`, `frontend`, `backend`, `database`, `external_service`, `service`, `component`

**Relation types:**  
`uses`, `calls`, `reads_writes`, `integrates`, `depends_on`, or fallback `connects`

**Example output:**

```json
{
  "nodes": [
    {"id": "User", "type": "actor"},
    {"id": "WebApp", "type": "frontend"},
    {"id": "API", "type": "backend"},
    {"id": "Database", "type": "database"},
    {"id": "PaymentGateway", "type": "external_service"}
  ],
  "edges": [
    {"from": "User", "to": "WebApp", "relation": "uses"},
    {"from": "WebApp", "to": "API", "relation": "calls"},
    {"from": "API", "to": "Database", "relation": "reads_writes"},
    {"from": "API", "to": "PaymentGateway", "relation": "integrates"}
  ]
}
```

---

## API

### `build_graph(input_data: dict) -> dict`

- Accepts the input contract above.
- **Deduplicates** nodes by `id`.
- **Ensures** every edge references existing nodes (adds missing nodes from interactions when needed).
- Maps entities to the controlled node types and normalizes relations via rule-based matching.
- **Deterministic:** same input → same graph.
- Raises no exception for unknown entities/relations; uses fallback types/relations.

### `to_mermaid(graph: dict) -> str`

- Accepts a validated graph (e.g. output of `build_graph`).
- Returns a string in **Mermaid.js flowchart** form (`graph TD` with nodes and labeled edges).
- Valid for use in frontends that render Mermaid diagrams.

### `validate_graph(graph: dict) -> None`

- Validates: no duplicate node IDs, no dangling edges, valid node types.
- Raises `ValueError` if the graph is invalid.

---

## Usage Example

```python
from graph_builder import build_graph, to_mermaid

input_data = {
    "entities": ["User", "WebApp", "API", "Database"],
    "interactions": [
        "User uses WebApp",
        "WebApp calls API",
        "API reads/writes Database",
    ],
}

graph = build_graph(input_data)
# graph["nodes"], graph["edges"] as in output contract

mermaid_str = to_mermaid(graph)
# e.g. "graph TD\n  User[\"User\"]\n  ..."
```

---

## How to Run Tests

From the `SpecForge` directory:

```bash
python -m unittest tests_graph_builder -v
```

Or with pytest (if installed):

```bash
pytest tests_graph_builder.py -v
```

Tests cover: full input/output contract, node deduplication, edges referencing only existing nodes, fallback relation `connects`, empty/malformed input, Mermaid output, and validation (duplicate nodes, dangling edges).

---

## Project Structure

| File                  | Purpose                                  |
|-----------------------|------------------------------------------|
| `graph_builder.py`    | Core logic: `build_graph`, `to_mermaid`, validation |
| `tests_graph_builder.py` | Unit tests                            |
| `README.md`           | This file – contracts, examples, run instructions |

---

## Integration Note

This module is designed to be **imported by a FastAPI backend** later. No FastAPI or server code is included; the API is purely `build_graph`, `to_mermaid`, and `validate_graph`.



---------------------------------------

# SpecForge – Core LLM Engine Module

Standalone Python module for the **Core LLM Engine** (SpecForge MVP). It interfaces with Large Language Models to transform raw user project descriptions into structured, validated technical specifications.

**Scope:** Week 1 MVP – Prompt Engineering, Scope Locking, and Structured Output.  
**Constraints:** Python 3.10+, `openai`, `pydantic`, `python-dotenv`.

## 🛠 Technical Architecture
The engine utilizes **Structured Outputs** to bridge the gap between non-deterministic AI text and deterministic software systems. By enforcing a Pydantic schema at the API level, we eliminate the need for manual parsing or regex cleaning.

### The Scope Lock (Pydantic Models)
The module defines the following internal structure to ensure data integrity:
* **`Entity`**: Captures system objects and their specific attributes.
* **`TechStack`**: Categorizes suggestions into Frontend, Backend, Database, and DevOps.
* **`ProjectSpec`**: The master container for all generated requirements.

## 📥 Input Contract
The module expects a raw natural language string.
**Example:** `"A university portal where students can upload assignments and teachers can grade them with AI feedback."`

## 📤 Output Contract
The module returns a strictly typed `ProjectSpec` object.

| Key | Type | Description |
| :--- | :--- | :--- |
| `functional_requirements` | `list[str]` | Actionable features (e.g., "Allow PDF uploads"). |
| `non_functional_requirements` | `list[str]` | Quality attributes (e.g., "Latency < 200ms"). |
| `entities` | `list[Entity]` | List of objects with `name` and `attributes`. |
| `tech_stack_suggestions` | `TechStack` | Recommended stack based on project complexity. |

### Example Output Data
```json
{
  "functional_requirements": ["User authentication", "Assignment submission"],
  "entities": [
    {"name": "User", "attributes": ["id", "email", "role"]},
    {"name": "Assignment", "attributes": ["title", "file_path", "grade"]}
  ],
  "tech_stack_suggestions": {
    "frontend": ["React", "Tailwind"],
    "backend": ["FastAPI"],
    "database": ["PostgreSQL"]
  }
}
