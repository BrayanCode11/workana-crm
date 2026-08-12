import assert from "node:assert/strict";
import test from "node:test";
import {
  extractBudget,
  extractCanonicalWorkanaUrl,
  extractContactCountry,
  extractContactName,
  extractDescription,
  extractMarkdownLinks,
  extractTechnologies,
  extractTitle,
  normalizeWorkanaText,
  parseWorkanaProject,
} from "./workana-parser";
import { multiparagraphProjectFixture, profileProjectFixture } from "./workana-parser.fixtures";

const completeProject = `# Desarrollo de Plataforma E-commerce para Empresa Metalmecánica

**Publicado el 07 Agosto, 2026 en Programación y Tecnología**

- [**Proyecto**](https://www.workana.com/job/desarrollo-de-plataforma-e-commerce-para-empresa-metalmecanica#)
- [**Data de competidores**](https://www.workana.com/job/insight/desarrollo-de-plataforma-e-commerce-para-empresa-metalmecanica)

##### Sobre este proyecto

#### USD 250 - 500

Se busca un desarrollador web o equipo para crear una plataforma de e-commerce completa.

La solución debe incluir catálogo, carrito y gestión de usuarios.

Categoría **Programación y Tecnología**
Subcategoría **Tiendas Online (e-commerce)**
¿Cuál es el alcance del proyecto? **Crear una tienda nueva**
Plazo de Entrega: No definido

**Habilidades necesarias**

[PHP](https://www.workana.com/jobs?skills=php)
[MySQL](https://www.workana.com/jobs?skills=mysql)
[JavaScript](https://www.workana.com/jobs?skills=javascript)
[javascript](https://www.workana.com/jobs?skills=javascript)
[Responsive Web Design](https://www.workana.com/jobs?skills=responsive-web-design)

Contacto: Juan Pérez
País: Colombia

https://www.workana.com/job/desarrollo-de-plataforma-e-commerce-para-empresa-metalmecanica`;

test("extrae un proyecto completo sin convertir el contacto en cliente", () => {
  const result = parseWorkanaProject(completeProject);
  assert.deepEqual(result, {
    title: "Desarrollo de Plataforma E-commerce para Empresa Metalmecánica",
    description: "Se busca un desarrollador web o equipo para crear una plataforma de e-commerce completa.\n\nLa solución debe incluir catálogo, carrito y gestión de usuarios.",
    contactName: "Juan Pérez",
    contactCountry: "Colombia",
    budgetMin: 250,
    budgetMax: 500,
    budgetCurrency: "USD",
    technologies: ["PHP", "MySQL", "JavaScript", "Responsive Web Design"],
    publishedAt: "2026-08-07",
    workanaUrl: "https://www.workana.com/job/desarrollo-de-plataforma-e-commerce-para-empresa-metalmecanica",
  });
  assert.equal("client_id" in result, false);
});

test("admite proyectos sin contacto", () => {
  assert.equal(parseWorkanaProject(completeProject.replace("Contacto: Juan Pérez\n", "")).contactName, null);
});

test("admite proyectos sin país", () => {
  assert.equal(parseWorkanaProject(completeProject.replace("País: Colombia\n", "")).contactCountry, null);
});

test("devuelve technologies vacío cuando la sección no contiene habilidades", () => {
  const text = completeProject.replace(/\[PHP][\s\S]*?\n\[Responsive Web Design].*?\n/, "");
  assert.deepEqual(parseWorkanaProject(text).technologies, []);
});

test("extrae un presupuesto único como mínimo y máximo", () => {
  const result = parseWorkanaProject("# Proyecto\n##### Sobre este proyecto\n#### USD 500\nDescripción");
  assert.equal(result.budgetMin, 500);
  assert.equal(result.budgetMax, 500);
  assert.equal(result.budgetCurrency, "USD");
});

test("extrae un rango de presupuesto", () => {
  const result = parseWorkanaProject("# Proyecto\n#### EUR 250 - 500\nDescripción");
  assert.deepEqual([result.budgetMin, result.budgetMax, result.budgetCurrency], [250, 500, "EUR"]);
});

test("interpreta separadores de miles", () => {
  const result = parseWorkanaProject("# Proyecto\n#### USD 1,000 - 2,500\nDescripción");
  assert.deepEqual([result.budgetMin, result.budgetMax], [1000, 2500]);
});

test("no inventa un presupuesto ausente", () => {
  const result = parseWorkanaProject("# Proyecto\n##### Sobre este proyecto\nDescripción");
  assert.deepEqual([result.budgetMin, result.budgetMax, result.budgetCurrency], [null, null, null]);
});

test("selecciona la URL principal entre varias URLs", () => {
  assert.equal(parseWorkanaProject(completeProject).workanaUrl, "https://www.workana.com/job/desarrollo-de-plataforma-e-commerce-para-empresa-metalmecanica");
});

test("ignora URLs /job/insight/", () => {
  const result = parseWorkanaProject("https://www.workana.com/job/insight/proyecto\nhttps://www.workana.com/job/proyecto-real#");
  assert.equal(result.workanaUrl, "https://www.workana.com/job/proyecto-real");
});

test("ignora URLs de skills", () => {
  const result = parseWorkanaProject("https://www.workana.com/jobs?skills=php");
  assert.equal(result.workanaUrl, null);
});

test("normaliza aliases y elimina tecnologías repetidas", () => {
  const text = "# Proyecto\n#### USD 10\nDescripción\n**Habilidades necesarias**\n[nextjs](x)\n[Next.js](x)\n[nodejs](x)\n[Wordpress](x)";
  assert.deepEqual(parseWorkanaProject(text).technologies, ["Next.js", "Node.js", "WordPress"]);
});

test("convierte fechas con mes español sin depender de mayúsculas", () => {
  assert.equal(parseWorkanaProject("# Proyecto\nPublicado el 9 septiembre, 2025").publishedAt, "2025-09-09");
});

test("conserva los párrafos razonablemente", () => {
  const text = "# Proyecto\n#### USD 100\nPrimer párrafo con\ncontinuación.\n\nSegundo párrafo.\nCategoría Desarrollo";
  assert.equal(parseWorkanaProject(text).description, "Primer párrafo con continuación.\n\nSegundo párrafo.");
});

test("excluye información irrelevante de la descripción", () => {
  const result = parseWorkanaProject(completeProject);
  assert.doesNotMatch(result.description ?? "", /Categoría|Subcategoría|Plazo|Habilidades|Contacto|País|workana\.com/);
});

test("tolera texto incompleto sin lanzar excepciones ni inventar datos", () => {
  assert.deepEqual(parseWorkanaProject("algo suelto"), {
    title: null,
    description: null,
    contactName: null,
    contactCountry: null,
    budgetMin: null,
    budgetMax: null,
    budgetCurrency: null,
    technologies: [],
    publishedAt: null,
    workanaUrl: null,
  });
});

test("tolera texto vacío", () => {
  assert.doesNotThrow(() => parseWorkanaProject(""));
  assert.equal(parseWorkanaProject("").title, null);
});

test("admite Cliente como alias de Contacto sin crear client_id", () => {
  const result = parseWorkanaProject("Cliente: María López\nPais: México");
  assert.equal(result.contactName, "María López");
  assert.equal(result.contactCountry, "México");
  assert.equal("client_id" in result, false);
});

test("detecta tecnologías explícitas en la descripción solo como fallback", () => {
  const result = parseWorkanaProject("# Proyecto\n##### Sobre este proyecto\nEl sitio utiliza WordPress y Elementor.");
  assert.deepEqual(result.technologies, ["WordPress", "Elementor"]);
});

test("detecta un título copiado como texto plano antes de la fecha", () => {
  const text = "Desarrollo de tienda online para empresa industrial\nPublicado el 07 Agosto, 2026 en Programación y Tecnología\nSobre este proyecto\nUSD 250 - 500\nDescripción";
  assert.equal(parseWorkanaProject(text).title, "Desarrollo de tienda online para empresa industrial");
});

test("separa habilidades planas para que el formulario pueda añadir comas", () => {
  const text = "Proyecto con tecnologías\nPublicado el 07 Agosto, 2026\nSobre este proyecto\nUSD 250\nDescripción\nHabilidades necesarias\nPHP MySQL HTML CSS JavaScript Responsive Web Design";
  assert.deepEqual(parseWorkanaProject(text).technologies, ["PHP", "MySQL", "HTML", "CSS", "JavaScript", "Responsive Web Design"]);
});

test("separa tecnologías desconocidas cuando el texto incluye delimitadores", () => {
  const text = "Proyecto\nPublicado el 07 Agosto, 2026\nHabilidades necesarias: Astro | SvelteKit | Mercado Pago";
  assert.deepEqual(parseWorkanaProject(text).technologies, ["Astro", "SvelteKit", "Mercado Pago"]);
});

test("extrae perfil, país, miles y skills válidas del formato con enlace /e/", () => {
  const result = parseWorkanaProject(profileProjectFixture);
  assert.deepEqual(result, {
    title: "Diseño y Desarrollo de Landing Page Profesional para Empresa de Construcción Subterránea",
    description: "Se requiere el diseño y desarrollo de una landing page profesional para una empresa especializada en obras de construcción subterránea.",
    contactName: "Cervecería T.",
    contactCountry: "Mexico",
    budgetMin: 500,
    budgetMax: 1000,
    budgetCurrency: "USD",
    technologies: ["Diseño Gráfico", "JavaScript", "Amazon Web Services (AWS)", "Google Web Toolkit"],
    publishedAt: "2026-08-11",
    workanaUrl: "https://www.workana.com/job/diseno-y-desarrollo-de-landing-page-profesional-para-empresa-de-construccion-subterranea",
  });
});

test("Contacto y País explícitos tienen prioridad sobre el perfil", () => {
  const text = `${profileProjectFixture}\nContacto: Juan Pérez\nPaís: Colombia`;
  assert.equal(extractContactName(normalizeWorkanaText(text)), "Juan Pérez");
  assert.equal(extractContactCountry(normalizeWorkanaText(text)), "Colombia");
});

test("soporta presupuesto Menos de sin inventar mínimo", () => {
  const budget = extractBudget("# Proyecto\n#### Menos de USD 50\nDescripción");
  assert.deepEqual([budget.min, budget.max, budget.currency], [null, 50, "USD"]);
});

test("soporta presupuesto Más de sin inventar máximo", () => {
  const budget = extractBudget("# Proyecto\n#### Más de USD 3.000\nDescripción");
  assert.deepEqual([budget.min, budget.max, budget.currency], [3000, null, "USD"]);
});

test("soporta rangos con puntos como separadores de miles", () => {
  const budget = extractBudget("# Proyecto\n#### USD 1.000 - 3.000\nDescripción");
  assert.deepEqual([budget.min, budget.max, budget.currency], [1000, 3000, "USD"]);
});

test("preserva párrafos y listas de la descripción sin incluir metadatos", () => {
  const description = extractDescription(normalizeWorkanaText(multiparagraphProjectFixture));
  assert.equal(description, [
    "Primer párrafo con el contexto principal del proyecto.",
    "Segundo párrafo que debe conservarse completo.",
    "- Primer requisito importante\n- Segundo requisito importante",
    "Tercer párrafo después de la lista.",
  ].join("\n\n"));
  assert.doesNotMatch(description ?? "", /Categoría|Habilidades|TypeScript/);
});

test("extrae varias skills válidas aunque estén en una misma línea", () => {
  const text = `# Proyecto\nSobre este proyecto\nDescripción\nHabilidades necesarias\n[HTML](https://www.workana.com/jobs?skills=html) [CSS](https://www.workana.com/jobs?skills=css)[JavaScript](https://www.workana.com/jobs?skills=javascript)`;
  assert.deepEqual(extractTechnologies(normalizeWorkanaText(text)), ["HTML", "CSS", "JavaScript"]);
});

test("extrae skills válidas en múltiples líneas e ignora perfil y proyecto", () => {
  assert.deepEqual(extractTechnologies(normalizeWorkanaText(profileProjectFixture)), [
    "Diseño Gráfico",
    "JavaScript",
    "Amazon Web Services (AWS)",
    "Google Web Toolkit",
  ]);
});

test("selecciona /job/{slug} entre múltiples links y elimina hash, query y slash final", () => {
  const text = [
    "https://www.workana.com/job/insight/proyecto",
    "https://www.workana.com/jobs?skills=javascript",
    "https://www.workana.com/e/perfil",
    "https://www.workana.com/job/proyecto-real/?source=listado#detalle",
  ].join("\n");
  assert.equal(extractCanonicalWorkanaUrl(text), "https://www.workana.com/job/proyecto-real");
});

test("parsea links Markdown con énfasis y título opcional", () => {
  assert.deepEqual(extractMarkdownLinks('[**Cervecería T.**](https://www.workana.com/e/abc "Perfil")'), [
    { text: "Cervecería T.", href: "https://www.workana.com/e/abc" },
  ]);
});

test("sin país validado después del perfil no utiliza texto administrativo", () => {
  const text = "[**Contacto**](https://www.workana.com/e/abc)\nDiseño y Multimedia\nhttps://www.workana.com/job/proyecto";
  assert.equal(extractContactCountry(text), null);
});

test("tolera NBSP, espacios extra y caracteres invisibles", () => {
  const text = "\u200b#   Proyecto con espacios \r\n\r\nPublicado el   11   AGOSTO,   2026\r\n#### USD 500 - 1.000";
  const normalized = normalizeWorkanaText(text);
  assert.equal(extractTitle(normalized), "Proyecto con espacios");
  const result = parseWorkanaProject(text);
  assert.equal(result.publishedAt, "2026-08-11");
  assert.deepEqual([result.budgetMin, result.budgetMax], [500, 1000]);
});

test("el primer heading H1 prevalece y no se confunde con headings de presupuesto", () => {
  assert.equal(extractTitle("# Título real\n##### Sobre este proyecto\n#### USD 500"), "Título real");
});
