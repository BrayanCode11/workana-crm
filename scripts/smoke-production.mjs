import assert from "node:assert/strict";

const rawUrl = process.argv[2] ?? process.env.PRODUCTION_URL;

if (!rawUrl) {
  console.error("Uso: npm run smoke:production -- https://tu-dominio.vercel.app");
  process.exit(1);
}

const baseUrl = new URL(rawUrl);

const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname);

if (baseUrl.protocol !== "https:" && !isLocalhost) {
  throw new Error("La URL de producción debe usar HTTPS.");
}

baseUrl.pathname = "/";
baseUrl.search = "";
baseUrl.hash = "";

const request = async (pathname, redirect = "manual") => {
  const response = await fetch(new URL(pathname, baseUrl), {
    redirect,
    signal: AbortSignal.timeout(15_000),
    headers: { "user-agent": "Prospecta production smoke test" },
  });

  return response;
};

const checkRedirect = async (pathname) => {
  const response = await request(pathname);
  assert.ok(
    [302, 303, 307, 308].includes(response.status),
    `${pathname} debía redirigir y respondió ${response.status}`,
  );

  const location = response.headers.get("location");
  assert.ok(location, `${pathname} no incluyó el encabezado Location`);
  assert.equal(new URL(location, baseUrl).pathname, "/login");
  console.log(`✓ ${pathname} protege el acceso y redirige a /login`);
};

await checkRedirect("/");
await checkRedirect("/dashboard");

const loginResponse = await request("/login", "follow");
assert.equal(loginResponse.status, 200, `/login respondió ${loginResponse.status}`);

const loginHtml = await loginResponse.text();
assert.match(loginHtml, /Prospecta/);
assert.match(loginHtml, /Bienvenido de nuevo/);
assert.equal(loginResponse.headers.get("x-content-type-options"), "nosniff");
assert.equal(loginResponse.headers.get("x-frame-options"), "DENY");
assert.equal(
  loginResponse.headers.get("referrer-policy"),
  "strict-origin-when-cross-origin",
);
assert.match(loginResponse.headers.get("permissions-policy") ?? "", /camera=\(\)/);
assert.match(loginResponse.headers.get("x-robots-tag") ?? "", /noindex/);
assert.equal(loginResponse.headers.get("x-powered-by"), null);
console.log("✓ /login responde con la interfaz y los encabezados de seguridad esperados");

const robotsResponse = await request("/robots.txt", "follow");
assert.equal(robotsResponse.status, 200, `/robots.txt respondió ${robotsResponse.status}`);
assert.match(await robotsResponse.text(), /Disallow: \/(?:\r?\n|$)/);
console.log("✓ robots.txt impide indexar el CRM privado");

console.log(`\nProducción validada: ${baseUrl.origin}`);
