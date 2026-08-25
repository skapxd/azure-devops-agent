import assert from "node:assert/strict";
import { test } from "vitest";

import { perfilesConToken } from "@/auth/perfiles-con-token.js";

test("en Windows busca los perfiles de PowerShell", () => {
  const rutas = perfilesConToken("win32").map((p) => p.ruta);
  assert.ok(rutas.some((r) => r.includes("Microsoft.PowerShell_profile.ps1")));
  assert.ok(rutas.some((r) => r.includes("WindowsPowerShell")));
});

test("en Windows sigue cubriendo Git Bash y WSL", () => {
  const rutas = perfilesConToken("win32").map((p) => p.ruta);
  assert.ok(rutas.includes(".bashrc"));
});

test("en macOS y Linux busca los perfiles POSIX, no los de Windows", () => {
  for (const plataforma of ["darwin", "linux"] as const) {
    const rutas = perfilesConToken(plataforma).map((p) => p.ruta);
    assert.ok(rutas.includes(".zshrc"));
    assert.ok(rutas.includes(".profile"));
    assert.ok(!rutas.some((r) => r.includes("PowerShell")));
  }
});

test("reconoce la sintaxis de PowerShell", () => {
  const perfil = perfilesConToken("win32").find((p) =>
    p.ruta.includes("Microsoft.PowerShell_profile.ps1"),
  );
  assert.ok(perfil);
  assert.equal(
    '$env:AZURE_DEVOPS_EXT_PAT = "tok-ps"'.match(perfil.patron)?.[1],
    "tok-ps",
  );
  // Sin espacios alrededor del igual, que también es válido.
  assert.equal(
    '$env:AZURE_DEVOPS_EXT_PAT="tok-ps"'.match(perfil.patron)?.[1],
    "tok-ps",
  );
});

test("reconoce la sintaxis POSIX", () => {
  const perfil = perfilesConToken("darwin").find((p) => p.ruta === ".zshrc");
  assert.ok(perfil);
  assert.equal(
    'export AZURE_DEVOPS_EXT_PAT="tok-posix"'.match(perfil.patron)?.[1],
    "tok-posix",
  );
});

test("no confunde las sintaxis entre plataformas", () => {
  const posix = perfilesConToken("darwin").find((p) => p.ruta === ".zshrc");
  const powershell = perfilesConToken("win32").find((p) =>
    p.ruta.includes("Microsoft.PowerShell_profile.ps1"),
  );
  assert.ok(posix && powershell);
  // Un perfil de PowerShell no debe leerse con el patrón POSIX ni al revés.
  assert.equal('$env:AZURE_DEVOPS_EXT_PAT = "x"'.match(posix.patron), null);
  assert.equal('export AZURE_DEVOPS_EXT_PAT="x"'.match(powershell.patron), null);
});
