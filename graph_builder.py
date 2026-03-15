import re
from typing import Any


# Allowed node types (controlled vocabulary)
NODE_TYPES = frozenset({
    "actor", "frontend", "backend", "database",
    "external_service", "service", "component",
})

# Relation keywords mapped to normalized relation names
RELATION_PATTERNS = [
    (re.compile(r"\buses?\b", re.I), "uses"),
    (re.compile(r"\bcalls?\b", re.I), "calls"),
    (re.compile(r"\breads?\s*[/&]?\s*writes?\b|\bwrites?\s*[/&]?\s*to\b", re.I), "reads_writes"),
    (re.compile(r"\bintegrates?\b", re.I), "integrates"),
    (re.compile(r"\bdepends?\s+on\b", re.I), "depends_on"),
]

# Keywords to infer entity type (order matters: more specific first)
ENTITY_TYPE_KEYWORDS = [
    ("actor", ["user", "admin", "actor", "customer"]),
    ("frontend", ["webapp", "web app", "frontend", "ui", "client", "dashboard", "app"]),
    ("backend", ["api", "backend", "server"]),
    ("database", ["database", "db", "storage", "repository"]),
    ("external_service", ["gateway", "payment", "external", "third.?party", "auth0", "stripe"]),
    ("service", ["service", "microservice"]),
    ("component", ["component", "module", "library"]),
]


def _infer_entity_type(entity_name: str) -> str:
    """
    Map an entity name to a controlled node type using keyword matching.

    Args:
        entity_name: Raw entity label (e.g. "User", "WebApp").

    Returns:
        One of: actor, frontend, backend, database, external_service, service, component.
        Defaults to "component" if no match.
    """
    name_lower = entity_name.strip().lower()
    for node_type, keywords in ENTITY_TYPE_KEYWORDS:
        for kw in keywords:
            if re.search(kw, name_lower):
                return node_type
    return "component"


def _extract_relation(interaction_text: str) -> str:
    """
    Extract normalized relation from an interaction string using rule-based matching.

    Args:
        interaction_text: e.g. "User uses WebApp", "API reads/writes Database".

    Returns:
        One of: uses, calls, reads_writes, integrates, depends_on; else "connects".
    """
    text = interaction_text.strip()
    for pattern, relation in RELATION_PATTERNS:
        if pattern.search(text):
            return relation
    return "connects"


def _parse_interaction(interaction: str) -> tuple[str, str, str] | None:
    """
    Parse "Source relation Target" into (source, relation, target).
    Handles common separators and relation verbs in the middle.

    Returns:
        (from_id, relation, to_id) or None if unparseable.
    """
    if not interaction or not isinstance(interaction, str):
        return None
    text = interaction.strip()
    if not text:
        return None

    # Try to split on known relation phrases (longest first for "depends on")
    relation_phrases = [" reads/writes ", " reads ", " writes ", " depends on ", " uses ", " calls ", " integrates "]
    for phrase in relation_phrases:
        if phrase.strip().lower() in text.lower():
            idx = text.lower().find(phrase.strip().lower())
            # Find actual case-insensitive span
            pattern = re.compile(re.escape(phrase.strip()), re.I)
            m = pattern.search(text)
            if m:
                left = text[: m.start()].strip()
                right = text[m.end() :].strip()
                if left and right:
                    rel = _extract_relation(text)
                    return (left, rel, right)
    # Fallback: split on first " relation " (word that matches our relations)
    for pattern, norm_rel in RELATION_PATTERNS:
        m = pattern.search(text)
        if m:
            before = text[: m.start()].strip()
            after = text[m.end() :].strip()
            if before and after:
                return (before, norm_rel, after)
    # Last resort: split on spaces and take first/last tokens (e.g. "A connects B")
    parts = text.split()
    if len(parts) >= 2:
        return (parts[0], "connects", parts[-1])
    return None


def build_graph(input_data: dict[str, Any]) -> dict[str, Any]:
    """
    Build a validated graph (nodes + edges) from AI-extracted entities and interactions.

    - Deduplicates nodes by id.
    - Ensures all edges reference existing nodes (dangling edges removed).
    - Maps entities to controlled node types and normalizes relations.

    Args:
        input_data: Dict with keys "entities" (list[str]) and "interactions" (list[str]).

    Returns:
        Dict with "nodes" (list of {"id", "type"}) and "edges" (list of {"from", "to", "relation"}).
    """
    entities_raw = input_data.get("entities") or []
    interactions_raw = input_data.get("interactions") or []

    if not isinstance(entities_raw, list):
        entities_raw = []
    if not isinstance(interactions_raw, list):
        interactions_raw = []

    # Build unique nodes from entities (deduplicate by id)
    seen_ids: set[str] = set()
    nodes: list[dict[str, str]] = []
    for e in entities_raw:
        if not isinstance(e, str):
            continue
        eid = e.strip()
        if not eid or eid in seen_ids:
            continue
        seen_ids.add(eid)
        nodes.append({"id": eid, "type": _infer_entity_type(eid)})

    # Add any nodes referenced in interactions but not in entities (no dangling edges)
    for interaction in interactions_raw:
        parsed = _parse_interaction(interaction)
        if not parsed:
            continue
        from_id, relation, to_id = parsed
        for nid in (from_id, to_id):
            if nid and nid not in seen_ids:
                seen_ids.add(nid)
                nodes.append({"id": nid, "type": _infer_entity_type(nid)})

    node_ids = frozenset(n["id"] for n in nodes)

    # Build edges from interactions; keep only those where both endpoints exist
    edges = []
    for interaction in interactions_raw:
        parsed = _parse_interaction(interaction)
        if not parsed:
            continue
        from_id, relation, to_id = parsed
        if from_id in node_ids and to_id in node_ids:
            edges.append({"from": from_id, "to": to_id, "relation": relation})

    graph = {"nodes": nodes, "edges": edges}
    validate_graph(graph)
    return graph


def validate_graph(graph: dict[str, Any]) -> None:
    """
    Validate graph structure: no duplicate node IDs, no dangling edges.

    Raises:
        ValueError: If validation fails.
    """
    nodes = graph.get("nodes") or []
    edges = graph.get("edges") or []

    ids_seen: set[str] = set()
    for n in nodes:
        nid = n.get("id")
        if nid is None or nid == "":
            raise ValueError("Node missing 'id'")
        if nid in ids_seen:
            raise ValueError(f"Duplicate node id: {nid!r}")
        ids_seen.add(nid)
        if n.get("type") not in NODE_TYPES:
            raise ValueError(f"Invalid node type: {n.get('type')!r} for node {nid!r}")

    for e in edges:
        from_id = e.get("from")
        to_id = e.get("to")
        if from_id not in ids_seen:
            raise ValueError(f"Edge references missing node: {from_id!r}")
        if to_id not in ids_seen:
            raise ValueError(f"Edge references missing node: {to_id!r}")
        if not e.get("relation"):
            raise ValueError("Edge missing 'relation'")


def to_mermaid(graph: dict[str, Any]) -> str:
    """
    Convert a validated graph to Mermaid.js flowchart syntax (graph TD).

    Args:
        graph: Dict with "nodes" and "edges" (e.g. output of build_graph).

    Returns:
        String in Mermaid flowchart format, e.g. "graph TD\\n  User --> WebApp\\n  ..."
    """
    validate_graph(graph)
    lines = ["graph TD"]
    # Mermaid: use simple IDs (no spaces) for references; display original label in brackets
    def safe_mermaid_id(nid: str) -> str:
        s = (nid or "").strip()
        if not s:
            return "N"
        # Replace spaces/special chars with underscore for a valid reference id
        s = re.sub(r"[\s\[\]()#;]+", "_", s).strip("_") or "N"
        return s

    for n in graph["nodes"]:
        mid = safe_mermaid_id(n["id"])
        label = (n["id"] or "").replace('"', "'")
        lines.append(f'  {mid}["{label}"]')
    for e in graph["edges"]:
        from_id = safe_mermaid_id(e["from"])
        to_id = safe_mermaid_id(e["to"])
        rel = (e.get("relation") or "connects").replace('"', "'")
        lines.append(f'  {from_id} -->|{rel}| {to_id}')
    return "\n".join(lines)
