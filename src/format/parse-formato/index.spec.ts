import assert from "node:assert/strict";
import { describe, test } from "vitest";

import { parseFormato } from "@/format/parse-formato";

describe("parseFormato", () => {
  test("un formato desconocido se rechaza en vez de caer al predeterminado", () => {
    const bueno = parseFormato("json");
    assert.equal(bueno.ok && bueno.value, "json");

    const malo = parseFormato("markdwon");
    assert.equal(malo.ok, false);
  });
});
