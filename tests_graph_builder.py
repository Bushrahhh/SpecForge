import unittest
from graph_builder import build_graph, to_mermaid, validate_graph, NODE_TYPES


class TestBuildGraph(unittest.TestCase):
    """Tests for build_graph input/output contract and behavior."""

    def test_spec_example_full_contract(self) -> None:
        """Realistic input from spec: entities + interactions → expected nodes and edges."""
        input_data = {
            "entities": ["User", "WebApp", "API", "Database", "PaymentGateway"],
            "interactions": [
                "User uses WebApp",
                "WebApp calls API",
                "API reads/writes Database",
                "API integrates PaymentGateway",
            ],
        }
        result = build_graph(input_data)

        self.assertIn("nodes", result)
        self.assertIn("edges", result)

        node_ids = {n["id"] for n in result["nodes"]}
        self.assertEqual(node_ids, {"User", "WebApp", "API", "Database", "PaymentGateway"})

        for n in result["nodes"]:
            self.assertIn(n["type"], NODE_TYPES)
            self.assertEqual(n["id"], n["id"].strip())

        expected_edges = [
            ("User", "WebApp", "uses"),
            ("WebApp", "API", "calls"),
            ("API", "Database", "reads_writes"),
            ("API", "PaymentGateway", "integrates"),
        ]
        self.assertEqual(len(result["edges"]), len(expected_edges))
        for e in result["edges"]:
            self.assertIn((e["from"], e["to"], e["relation"]), expected_edges)

        # Determinism: same input → same graph
        result2 = build_graph(input_data)
        self.assertEqual(result["nodes"], result2["nodes"])
        self.assertEqual(result["edges"], result2["edges"])

    def test_deduplicate_nodes(self) -> None:
        """Duplicate entities produce a single node per id."""
        input_data = {
            "entities": ["API", "API", "Database", "API"],
            "interactions": ["API reads/writes Database"],
        }
        result = build_graph(input_data)
        ids = [n["id"] for n in result["nodes"]]
        self.assertEqual(ids, ["API", "Database"])
        self.assertEqual(len(result["edges"]), 1)
        self.assertEqual(result["edges"][0]["relation"], "reads_writes")

    def test_edges_reference_existing_nodes_only(self) -> None:
        """Interactions mentioning only one known entity still produce valid graph (other node added from interaction)."""
        input_data = {
            "entities": ["API"],
            "interactions": ["API calls AuthService"],
        }
        result = build_graph(input_data)
        node_ids = {n["id"] for n in result["nodes"]}
        self.assertIn("API", node_ids)
        self.assertIn("AuthService", node_ids)
        for e in result["edges"]:
            self.assertIn(e["from"], node_ids)
            self.assertIn(e["to"], node_ids)

    def test_fallback_relation_connects(self) -> None:
        """Unknown relation verb falls back to 'connects'."""
        input_data = {
            "entities": ["A", "B"],
            "interactions": ["A talks to B"],
        }
        result = build_graph(input_data)
        self.assertEqual(len(result["edges"]), 1)
        self.assertEqual(result["edges"][0]["relation"], "connects")

    def test_empty_and_graceful_input(self) -> None:
        """Empty or malformed input produces valid empty graph."""
        result = build_graph({})
        self.assertEqual(result["nodes"], [])
        self.assertEqual(result["edges"], [])

        result = build_graph({"entities": [], "interactions": []})
        self.assertEqual(result["nodes"], [])
        self.assertEqual(result["edges"], [])

        # Single entity, unparseable interaction: graph valid; edges only reference existing nodes
        result = build_graph({"entities": ["X"], "interactions": ["gibberish"]})
        self.assertGreaterEqual(len(result["nodes"]), 1)
        self.assertIn("X", {n["id"] for n in result["nodes"]})
        node_ids = {n["id"] for n in result["nodes"]}
        for e in result["edges"]:
            self.assertIn(e["from"], node_ids)
            self.assertIn(e["to"], node_ids)


class TestToMermaid(unittest.TestCase):
    """Tests for to_mermaid output."""

    def test_mermaid_flowchart_syntax(self) -> None:
        """Output is valid graph TD with nodes and labeled edges."""
        graph = {
            "nodes": [
                {"id": "User", "type": "actor"},
                {"id": "WebApp", "type": "frontend"},
            ],
            "edges": [{"from": "User", "to": "WebApp", "relation": "uses"}],
        }
        m = to_mermaid(graph)
        self.assertTrue(m.startswith("graph TD"))
        self.assertIn("User", m)
        self.assertIn("WebApp", m)
        self.assertIn("uses", m)
        self.assertIn("-->", m)

    def test_mermaid_spec_example_roundtrip(self) -> None:
        """build_graph → to_mermaid produces parseable flowchart for spec example."""
        input_data = {
            "entities": ["User", "WebApp", "API", "Database", "PaymentGateway"],
            "interactions": [
                "User uses WebApp",
                "WebApp calls API",
                "API reads/writes Database",
                "API integrates PaymentGateway",
            ],
        }
        graph = build_graph(input_data)
        m = to_mermaid(graph)
        self.assertIn("graph TD", m)
        for name in ["User", "WebApp", "API", "Database", "PaymentGateway"]:
            self.assertIn(name, m)
        for rel in ["uses", "calls", "reads_writes", "integrates"]:
            self.assertIn(rel, m)


class TestValidateGraph(unittest.TestCase):
    """Tests for graph validation."""

    def test_valid_graph_passes(self) -> None:
        """Valid graph does not raise."""
        graph = {
            "nodes": [{"id": "A", "type": "component"}, {"id": "B", "type": "component"}],
            "edges": [{"from": "A", "to": "B", "relation": "connects"}],
        }
        validate_graph(graph)

    def test_duplicate_node_id_raises(self) -> None:
        """Duplicate node id raises ValueError."""
        graph = {
            "nodes": [{"id": "A", "type": "component"}, {"id": "A", "type": "backend"}],
            "edges": [],
        }
        with self.assertRaises(ValueError) as ctx:
            validate_graph(graph)
        self.assertIn("Duplicate", str(ctx.exception))

    def test_dangling_edge_raises(self) -> None:
        """Edge referencing missing node raises ValueError."""
        graph = {
            "nodes": [{"id": "A", "type": "component"}],
            "edges": [{"from": "A", "to": "Missing", "relation": "connects"}],
        }
        with self.assertRaises(ValueError) as ctx:
            validate_graph(graph)
        self.assertIn("missing node", str(ctx.exception).lower())


if __name__ == "__main__":
    unittest.main()
