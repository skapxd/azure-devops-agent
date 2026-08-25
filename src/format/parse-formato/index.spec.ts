import assert from "node:assert/strict";
import { test } from "vitest";

import { parseFormato } from "@/format/parse-formato";

test("un formato desconocido se rechaza en vez de caer al predeterminado", () => {
  const bueno = parseFormato("json");
  assert.equal(bueno.ok && bueno.value, "json");

  const malo = parseFormato("markdwon");
  assert.equal(malo.ok, false);
});
