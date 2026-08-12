import { currencies } from "./constants";

export type ParsedWorkanaProject = {
  title: string | null;
  description: string | null;
  contactName: string | null;
  contactCountry: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetCurrency: string | null;
  technologies: string[];
  publishedAt: string | null;
  workanaUrl: string | null;
};

export type MarkdownLink = {
  text: string;
  href: string;
};

export type ExtractedWorkanaBudget = {
  min: number | null;
  max: number | null;
  currency: string | null;
  lineIndex: number;
};

const emptyResult: ParsedWorkanaProject = {
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
};

const emptyBudget: ExtractedWorkanaBudget = {
  min: null,
  max: null,
  currency: null,
  lineIndex: -1,
};

const spanishMonths: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

const technologyAliases: Record<string, string> = {
  wordpress: "WordPress",
  woocommerce: "WooCommerce",
  javascript: "JavaScript",
  typescript: "TypeScript",
  nextjs: "Next.js",
  "next.js": "Next.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
};

const explicitTechnologyPatterns: Array<[RegExp, string]> = [
  [/\bwordpress\b/i, "WordPress"],
  [/\bwoocommerce\b/i, "WooCommerce"],
  [/\belementor\b/i, "Elementor"],
  [/\bjava\s*script\b/i, "JavaScript"],
  [/\btype\s*script\b/i, "TypeScript"],
  [/\bnext(?:\.?js)\b/i, "Next.js"],
  [/\bnode(?:\.?js)\b/i, "Node.js"],
  [/\bphp\b/i, "PHP"],
  [/\bmysql\b/i, "MySQL"],
  [/\bhtml\b/i, "HTML"],
  [/\bcss\b/i, "CSS"],
  [/\bstripe\b/i, "Stripe"],
  [/\bfigma\b/i, "Figma"],
  [/\bshopify\b/i, "Shopify"],
  [/\brest\s+api\b/i, "REST API"],
];

const plainTechnologySequence = /Responsive Web Design|REST API|WooCommerce|WordPress|JavaScript|TypeScript|Next(?:\.?js)|Node(?:\.?js)|React(?:\.?js)?|Vue(?:\.?js)?|PostgreSQL|Supabase|Firebase|Elementor|Shopify|Stripe|Figma|Python|Django|Laravel|Angular|Docker|MySQL|HTML|CSS|PHP|AWS|Git/gi;

const recognizedCountries = new Set([
  "argentina", "bolivia", "brasil", "brazil", "canada", "chile", "colombia",
  "costa rica", "cuba", "ecuador", "el salvador", "espana", "estados unidos",
  "guatemala", "haiti", "honduras", "mexico", "nicaragua", "panama", "paraguay",
  "peru", "portugal", "puerto rico", "republica dominicana", "uruguay", "venezuela",
  "united states", "united kingdom", "reino unido", "alemania", "germany", "francia",
  "france", "italia", "italy", "paises bajos", "netherlands", "belgica", "belgium",
  "suiza", "switzerland", "suecia", "sweden", "noruega", "norway", "dinamarca",
  "denmark", "irlanda", "ireland", "polonia", "poland", "austria", "australia",
  "nueva zelanda", "new zealand", "india", "china", "japon", "japan", "israel",
  "turquia", "turkey", "sudafrica", "south africa", "republica checa", "czech republic",
].map((country) => normalizeForComparison(country)));

export function normalizeWorkanaText(rawText: string) {
  return String(rawText ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/[\u200b-\u200d\u2060\ufeff]/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function extractMarkdownLinks(rawText: string): MarkdownLink[] {
  const links: MarkdownLink[] = [];
  for (const match of String(rawText ?? "").matchAll(markdownLinkPattern())) {
    const text = cleanMarkdownLabel(match[1]);
    const href = match[2]?.trim();
    if (text && href) links.push({ text, href });
  }
  return links;
}

export function extractTitle(text: string): string | null {
  const lines = normalizeWorkanaText(text).split("\n");
  for (const line of lines) {
    const match = line.trim().match(/^#\s+(.+?)\s*$/);
    if (match) return cleanInlineMarkdown(match[1]) || null;
  }

  // Conserva compatibilidad con copias que pierden el heading, pero solo cuando
  // el resto del documento contiene anclas inequívocas de un proyecto Workana.
  if (!hasWorkanaProjectStructure(lines)) return null;
  const publishedIndex = lines.findIndex((line) => /publicado\s+el\b/i.test(cleanInlineMarkdown(line)));
  const searchEnd = publishedIndex >= 0 ? publishedIndex : lines.length;
  for (let index = searchEnd - 1; index >= 0; index -= 1) {
    const candidate = titleCandidate(lines[index]);
    if (isPossiblePlainTitle(candidate)) return candidate;
  }
  for (const line of lines) {
    const candidate = titleCandidate(line);
    if (isPossiblePlainTitle(candidate)) return candidate;
  }
  return null;
}

export function extractPublishedAt(text: string): string | null {
  const match = normalizeWorkanaText(text).match(/publicado\s+el\s+(\d{1,2})\s+([a-záéíóúñ]+)\s*,?\s*(\d{4})/i);
  if (!match) return null;
  const day = Number(match[1]);
  const month = spanishMonths[normalizeForComparison(match[2])];
  const year = Number(match[3]);
  if (!month || !isValidDate(year, month, day)) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function extractBudget(text: string): ExtractedWorkanaBudget {
  const supportedCurrencies = new Set<string>(currencies);
  const lines = normalizeWorkanaText(text).split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = cleanInlineMarkdown(lines[index]).replace(/^#{1,6}\s*/, "").trim();
    const match = line.match(/^(?:(menos|m[aá]s)\s+de\s+)?([a-z]{3})\s+([\d.,]+)(?:\s*[-–—]\s*([\d.,]+))?\s*$/i);
    if (!match) continue;
    const qualifier = normalizeForComparison(match[1] ?? "");
    const currency = match[2].toUpperCase();
    const first = parseBudgetAmount(match[3]);
    const second = match[4] ? parseBudgetAmount(match[4]) : null;
    if (first === null || (match[4] && second === null)) continue;

    return {
      min: qualifier === "menos" ? null : first,
      max: qualifier === "mas" ? null : second ?? first,
      currency: supportedCurrencies.has(currency) ? currency : null,
      lineIndex: index,
    };
  }
  return { ...emptyBudget };
}

export function extractDescription(text: string, budget = extractBudget(text)): string | null {
  const lines = normalizeWorkanaText(text).split("\n");
  let start = budget.lineIndex >= 0 ? budget.lineIndex + 1 : -1;
  if (start < 0) {
    const aboutIndex = lines.findIndex((line) => normalizeHeading(line) === "sobre este proyecto");
    if (aboutIndex >= 0) start = aboutIndex + 1;
  }
  if (start < 0) return null;

  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flushParagraph = () => {
    const value = paragraph.join(" ").replace(/\s+/g, " ").trim();
    if (value) blocks.push(value);
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push(list.join("\n"));
    list = [];
  };

  for (let index = start; index < lines.length; index += 1) {
    const rawLine = lines[index].trim();
    if (isDescriptionBoundary(rawLine)) break;
    if (!rawLine) {
      flushParagraph();
      flushList();
      continue;
    }
    if (/^#{1,6}\s/.test(rawLine)) continue;
    if (isStandaloneMarkdownLink(rawLine) || extractCanonicalWorkanaUrl(rawLine)) continue;

    const listMatch = rawLine.match(/^([-*+]\s+|\d+[.)]\s+)(.+)$/);
    if (listMatch) {
      flushParagraph();
      const marker = /^\d/.test(listMatch[1]) ? listMatch[1].trim() : "-";
      const value = cleanInlineMarkdown(listMatch[2]);
      if (value) list.push(`${marker} ${value}`);
      continue;
    }

    flushList();
    const clean = cleanInlineMarkdown(rawLine);
    if (clean) paragraph.push(clean);
  }
  flushParagraph();
  flushList();
  return blocks.length ? blocks.join("\n\n") : null;
}

export function extractTechnologies(text: string, description = extractDescription(text)): string[] {
  const lines = normalizeWorkanaText(text).split("\n");
  const sectionIndex = lines.findIndex((line) => normalizeHeading(line).startsWith("habilidades necesarias"));
  if (sectionIndex < 0) return extractTechnologiesFromDescription(description);

  const sectionLines: string[] = [];
  const headingContent = cleanInlineMarkdown(lines[sectionIndex])
    .replace(/^#{1,6}\s*/, "")
    .replace(/^habilidades necesarias\s*:?\s*/i, "")
    .trim();
  if (headingContent) sectionLines.push(headingContent);

  for (let index = sectionIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    if (isSkillsBoundary(line)) break;
    sectionLines.push(line);
  }

  const skillLinks = extractMarkdownLinks(sectionLines.join("\n")).filter((link) => isWorkanaSkillUrl(link.href));
  if (skillLinks.length) {
    const technologies: string[] = [];
    skillLinks.forEach((link) => addTechnology(technologies, link.text));
    return technologies;
  }

  // Algunas copias del navegador pierden los href y dejan las habilidades como texto.
  const technologies: string[] = [];
  sectionLines.forEach((line) => {
    if (/^https?:\/\//i.test(line)) return;
    const labels = Array.from(line.matchAll(/\[([^\]]+)]\([^)]*\)/g), (match) => cleanMarkdownLabel(match[1]));
    if (labels.length) labels.forEach((label) => addTechnology(technologies, label));
    else addPlainTechnologies(technologies, cleanInlineMarkdown(line.replace(/^[-*+]\s+/, "")));
  });
  return technologies.length ? technologies : extractTechnologiesFromDescription(description);
}

export function extractContactName(text: string): string | null {
  const normalizedText = normalizeWorkanaText(text);
  const lines = normalizedText.split("\n");
  const explicit = extractLabeledValue(lines, /^(?:contacto|cliente)\s*:/i);
  if (explicit) return explicit;
  const profile = extractMarkdownLinks(normalizedText).find((link) => isWorkanaProfileUrl(link.href));
  return profile?.text || null;
}

export function extractContactCountry(text: string): string | null {
  const lines = normalizeWorkanaText(text).split("\n");
  const explicit = extractLabeledValue(lines, /^pa[ií]s\s*:/i);
  if (explicit) return explicit;

  const profileLineIndex = lines.findIndex((line) => extractMarkdownLinks(line).some((link) => isWorkanaProfileUrl(link.href)));
  if (profileLineIndex < 0) return null;
  for (let index = profileLineIndex + 1; index < lines.length; index += 1) {
    const rawLine = lines[index].trim();
    if (!rawLine) continue;
    if (extractMarkdownLinks(rawLine).length || /^https?:\/\//i.test(rawLine)) return null;
    const candidate = cleanInlineMarkdown(rawLine.replace(/^[-*+]\s+/, ""));
    return recognizedCountries.has(normalizeForComparison(candidate)) ? candidate : null;
  }
  return null;
}

export function extractCanonicalWorkanaUrl(input: string): string | null {
  const candidates = [
    ...extractMarkdownLinks(input).map((link) => link.href),
    ...(String(input ?? "").match(/https?:\/\/[^\s<>()\[\]"']+/gi) ?? []),
  ];
  for (const rawCandidate of candidates) {
    const candidate = rawCandidate.replace(/[.,;:!?*_'"}]+$/g, "").replace(/#+$/g, "");
    try {
      const url = new URL(candidate);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const segments = url.pathname.split("/").filter(Boolean);
      if (host !== "workana.com" || segments.length !== 2 || segments[0].toLowerCase() !== "job") continue;
      if (segments[1].toLowerCase() === "insight") continue;
      return `https://www.workana.com/job/${segments[1]}`;
    } catch {
      // Continúa con el siguiente candidato; el texto pegado no es confiable.
    }
  }
  return null;
}

export const normalizeWorkanaProjectUrl = extractCanonicalWorkanaUrl;

export function parseWorkanaProject(rawText: string): ParsedWorkanaProject {
  const text = normalizeWorkanaText(rawText);
  if (!text) return { ...emptyResult, technologies: [] };
  const budget = safely(() => extractBudget(text), { ...emptyBudget });
  const description = safely(() => extractDescription(text, budget), null);
  return {
    title: safely(() => extractTitle(text), null),
    description,
    contactName: safely(() => extractContactName(text), null),
    contactCountry: safely(() => extractContactCountry(text), null),
    budgetMin: budget.min,
    budgetMax: budget.max,
    budgetCurrency: budget.currency,
    technologies: safely(() => extractTechnologies(text, description), []),
    publishedAt: safely(() => extractPublishedAt(text), null),
    workanaUrl: safely(() => extractCanonicalWorkanaUrl(text), null),
  };
}

function safely<T>(extractor: () => T, fallback: T): T {
  try {
    return extractor();
  } catch {
    return fallback;
  }
}

function markdownLinkPattern() {
  return /\[([^\]\n]+)]\(\s*(https?:\/\/[^\s)]+)(?:\s+(?:"[^"\n]*"|'[^'\n]*'|\([^\n)]*\)))?\s*\)/gi;
}

function parseBudgetAmount(value: string): number | null {
  const compact = value.replace(/\s/g, "");
  if (!/^\d+(?:[.,]\d+)*$/.test(compact)) return null;
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(compact)) return Number(compact.replace(/[.,]/g, ""));

  const lastDot = compact.lastIndexOf(".");
  const lastComma = compact.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    const decimalIndex = Math.max(lastDot, lastComma);
    const integer = compact.slice(0, decimalIndex).replace(/[.,]/g, "");
    const decimals = compact.slice(decimalIndex + 1);
    const amount = Number(`${integer}.${decimals}`);
    return Number.isFinite(amount) ? amount : null;
  }
  const separatorIndex = Math.max(lastDot, lastComma);
  if (separatorIndex >= 0) {
    const decimals = compact.length - separatorIndex - 1;
    const normalized = decimals <= 2
      ? `${compact.slice(0, separatorIndex).replace(/[.,]/g, "")}.${compact.slice(separatorIndex + 1)}`
      : compact.replace(/[.,]/g, "");
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : null;
  }
  const amount = Number(compact);
  return Number.isFinite(amount) ? amount : null;
}

function titleCandidate(line: string) {
  return cleanInlineMarkdown(line)
    .replace(/^#{1,6}\s*/, "")
    .replace(/^t[ií]tulo\s*:\s*/i, "")
    .trim();
}

function hasWorkanaProjectStructure(lines: string[]) {
  return lines.some((line) => (
    /publicado\s+el\b/i.test(cleanInlineMarkdown(line))
    || normalizeHeading(line) === "sobre este proyecto"
    || /^#{0,6}\s*(?:menos|m[aá]s)?\s*(?:de\s+)?[A-Z]{3}\s+[\d.,]+/i.test(cleanInlineMarkdown(line))
    || normalizeHeading(line).startsWith("habilidades necesarias")
    || Boolean(extractCanonicalWorkanaUrl(line))
  ));
}

function isPossiblePlainTitle(candidate: string) {
  if (!candidate || candidate.length > 240 || /^https?:\/\//i.test(candidate)) return false;
  const normalized = normalizeForComparison(candidate);
  return !/^(publicado el\b|proyecto$|data de competidores\b|sobre este proyecto$|categoria\b|subcategoria\b|plazo de entrega\b|habilidades necesarias\b|contacto\s*:|cliente\s*:|pais\s*:|(?:menos|mas)?\s*(?:de\s+)?[a-z]{3}\s+[\d.,]+)/i.test(normalized);
}

function isDescriptionBoundary(line: string) {
  const normalized = normalizeForComparison(cleanInlineMarkdown(line).replace(/^#{1,6}\s*/, ""));
  return /^(categoria\b|subcategoria\b|¿?que necesitas\b|¿?cual es el alcance\b|plazo de entrega\b|habilidades necesarias\b|contacto\s*:|cliente\s*:|pais\s*:)/i.test(normalized)
    || extractMarkdownLinks(line).some((link) => isWorkanaProfileUrl(link.href));
}

function isSkillsBoundary(line: string) {
  const normalized = normalizeForComparison(cleanInlineMarkdown(line).replace(/^#{1,6}\s*/, ""));
  return /^(contacto\s*:|cliente\s*:|pais\s*:|categoria\b|subcategoria\b|plazo de entrega\b)/.test(normalized)
    || extractMarkdownLinks(line).some((link) => isWorkanaProfileUrl(link.href))
    || Boolean(extractCanonicalWorkanaUrl(line));
}

function isWorkanaSkillUrl(href: string) {
  try {
    const url = new URL(href);
    return url.hostname.toLowerCase().replace(/^www\./, "") === "workana.com"
      && url.pathname.replace(/\/+$/, "").toLowerCase() === "/jobs"
      && url.searchParams.has("skills");
  } catch {
    return false;
  }
}

function isWorkanaProfileUrl(href: string) {
  try {
    const url = new URL(href);
    const segments = url.pathname.split("/").filter(Boolean);
    return url.hostname.toLowerCase().replace(/^www\./, "") === "workana.com"
      && segments.length === 2
      && segments[0].toLowerCase() === "e"
      && Boolean(segments[1]);
  } catch {
    return false;
  }
}

function extractTechnologiesFromDescription(description: string | null) {
  if (!description) return [];
  const technologies: string[] = [];
  for (const [pattern, name] of explicitTechnologyPatterns) {
    if (pattern.test(description)) addTechnology(technologies, name);
  }
  return technologies;
}

function addPlainTechnologies(technologies: string[], value: string) {
  const separated = value.split(/\s*(?:,|;|\||•|·|\t)\s*/).filter(Boolean);
  if (separated.length > 1) {
    separated.forEach((technology) => addTechnology(technologies, technology));
    return;
  }
  const knownMatches = Array.from(value.matchAll(plainTechnologySequence), (match) => match[0]);
  const remainder = value.replace(plainTechnologySequence, "").replace(/[\s,;|•·/+-]+/g, "");
  if (knownMatches.length > 1 && !remainder) {
    knownMatches.forEach((technology) => addTechnology(technologies, technology));
    return;
  }
  addTechnology(technologies, value);
}

function addTechnology(technologies: string[], rawName: string) {
  const trimmed = cleanMarkdownLabel(rawName).replace(/^[`*_]+|[`*_.]+$/g, "").trim();
  if (!trimmed || trimmed.length > 100 || /^https?:\/\//i.test(trimmed)) return;
  const aliasKey = trimmed.toLowerCase().replace(/\s+/g, "");
  const normalized = technologyAliases[aliasKey] ?? technologyAliases[trimmed.toLowerCase()] ?? trimmed;
  if (!technologies.some((technology) => technology.toLocaleLowerCase("es") === normalized.toLocaleLowerCase("es"))) {
    technologies.push(normalized);
  }
}

function extractLabeledValue(lines: string[], label: RegExp) {
  for (const rawLine of lines) {
    const line = cleanInlineMarkdown(rawLine.replace(/^[-*+]\s+/, ""));
    if (!label.test(line)) continue;
    const value = line.replace(label, "").trim();
    return value || null;
  }
  return null;
}

function normalizeHeading(value: string) {
  return normalizeForComparison(cleanInlineMarkdown(value).replace(/^#{1,6}\s*/, ""));
}

function cleanMarkdownLabel(value: string) {
  return String(value ?? "").replace(/[*_`~]/g, "").replace(/\s+/g, " ").trim();
}

function cleanInlineMarkdown(value: string) {
  return String(value ?? "")
    .replace(markdownLinkPattern(), (_match, label: string) => cleanMarkdownLabel(label))
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

function isStandaloneMarkdownLink(value: string) {
  const trimmed = value.replace(/^[-*+]\s+/, "").trim();
  const links = extractMarkdownLinks(trimmed);
  if (links.length !== 1) return false;
  const withoutLink = trimmed.replace(markdownLinkPattern(), "").trim();
  return withoutLink === "";
}

function normalizeForComparison(value: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isValidDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
