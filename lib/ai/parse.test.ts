import { describe, expect, it } from "vitest";
import { parseJson } from "./parse";

describe("parseJson", () => {
  it("parses a bare JSON object", () => {
    expect(parseJson('{"a": 1}')).toEqual({ a: 1 });
  });

  it("strips ```json code fences", () => {
    expect(parseJson('```json\n{"reply": "hi", "edits": []}\n```')).toEqual({ reply: "hi", edits: [] });
  });

  it("extracts the object from surrounding prose", () => {
    expect(parseJson('Sure! Here you go: {"adults": 2, "kidAges": [5, 8]} Hope that helps.')).toEqual({ adults: 2, kidAges: [5, 8] });
  });

  it("handles nested objects using the outermost braces", () => {
    expect(parseJson('{"prepared": {"kind": "resort_change", "to": "Riviera"}}')).toEqual({ prepared: { kind: "resort_change", to: "Riviera" } });
  });

  it("throws on content with no JSON object (callers fall back deterministically)", () => {
    expect(() => parseJson("I'm sorry, I can't help with that.")).toThrow();
  });
});
