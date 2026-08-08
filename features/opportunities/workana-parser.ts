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

export function parseWorkanaProject(rawText: string): ParsedWorkanaProject {
  try {
    const text = String(rawText ?? "").replace(/\r\n?/g, "\n").trim();
    if (!text) return { ...emptyResult, technologies: [] };

    const lines = text.split("\n");
    const budget = parseBudget(lines);
    const description = parseDescription(lines, budget.lineIndex);
    const skills = parseSkills(lines);

    return {
      title: parseTitle(lines),
      description,
      contactName: parseLabeledValue(lines, /^(?:contacto|cliente)\s*:/i),
      contactCountry: parseLabeledValue(lines, /^pa[ií]s\s*:/i),
      budgetMin: budget.min,
      budgetMax: budget.max,
      budgetCurrency: budget.currency,
      technologies: skills.foundSection ? skills.technologies : parseTechnologiesFromDescription(description),
      publishedAt: parsePublishedAt(text),
      workanaUrl: normalizeWorkanaProjectUrl(text),
    };
  } catch {
    return { ...emptyResult, technologies: [] };
  }
}

export function normalizeWorkanaProjectUrl(input: string): string | null {
  const matches = String(input ?? "").match(/https?:\/\/[^\s<>()\]]+/gi) ?? [];

  for (const match of matches) {
    const candidate = match.replace(/[.,;:!?*_'"}]+$/g, "").replace(/#+$/g, "");
    try {
      const url = new URL(candidate);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const segments = url.pathname.split("/").filter(Boolean);
      if (host !== "workana.com" || segments.length !== 2 || segments[0].toLowerCase() !== "job") continue;
      if (segments[1].toLowerCase() === "insight") continue;
      return `https://www.workana.com/job/${segments[1]}`;
    } catch {
      // Ignora enlaces incompletos o mal formados y continúa con el siguiente.
    }
  }

  return null;
}

function parseTitle(lines: string[]) {
  for (const line of lines) {
    const match = line.trim().match(/^#\s+(.+?)\s*$/);
    if (match) return cleanInlineMarkdown(match[1]) || null;
  }

  if (!hasWorkanaProjectStructure(lines)) return null;
  const publishedIndex = lines.findIndex((line) => /publicado\s+el\b/i.test(cleanInlineMarkdown(line)));
  const searchEnd = publishedIndex >= 0 ? publishedIndex : lines.length;
  for (let index = searchEnd - 1; index >= 0; index -= 1) {
    const candidate = cleanInlineMarkdown(lines[index]).replace(/^#{1,6}\s*/, "").replace(/^t[ií]tulo\s*:\s*/i, "").trim();
    if (isPossiblePlainTitle(candidate)) return candidate;
  }

  for (const line of lines) {
    const candidate = cleanInlineMarkdown(line).replace(/^#{1,6}\s*/, "").replace(/^t[ií]tulo\s*:\s*/i, "").trim();
    if (isPossiblePlainTitle(candidate)) return candidate;
  }
  return null;
}

function hasWorkanaProjectStructure(lines: string[]) {
  return lines.some((line) => (
    /publicado\s+el\b/i.test(cleanInlineMarkdown(line))
    || normalizeHeading(line) === "sobre este proyecto"
    || /^#{0,6}\s*[A-Z]{3}\s+[\d.,]+/i.test(cleanInlineMarkdown(line))
    || normalizeHeading(line).startsWith("habilidades necesarias")
    || Boolean(normalizeWorkanaProjectUrl(line))
  ));
}

function isPossiblePlainTitle(candidate: string) {
  if (!candidate || candidate.length > 240 || /^https?:\/\//i.test(candidate)) return false;
  const normalized = stripDiacritics(candidate).toLowerCase();
  return !/^(publicado el\b|proyecto$|data de competidores\b|sobre este proyecto$|categoria\b|subcategoria\b|plazo de entrega\b|habilidades necesarias\b|contacto\s*:|cliente\s*:|pais\s*:|[A-Z]{3}\s+[\d.,]+)/i.test(normalized);
}

function parsePublishedAt(text: string) {
  const match = text.match(/publicado\s+el\s+(\d{1,2})\s+([a-záéíóúñ]+)\s*,?\s*(\d{4})/i);
  if (!match) return null;

  const day = Number(match[1]);
  const month = spanishMonths[stripDiacritics(match[2]).toLowerCase()];
  const year = Number(match[3]);
  if (!month || !isValidDate(year, month, day)) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseBudget(lines: string[]) {
  const supportedCurrencies = new Set<string>(currencies);
  for (let index = 0; index < lines.length; index += 1) {
    const line = cleanInlineMarkdown(lines[index]).replace(/^#{1,6}\s*/, "").trim();
    const match = line.match(/^([A-Z]{3})\s+([\d.,]+)(?:\s*[-–—]\s*([\d.,]+))?\s*$/i);
    if (!match) continue;

    const currency = match[1].toUpperCase();
    const first = parseAmount(match[2]);
    const second = match[3] ? parseAmount(match[3]) : first;
    if (first === null || second === null) continue;
    return {
      min: first,
      max: second,
      currency: supportedCurrencies.has(currency) ? currency : null,
      lineIndex: index,
    };
  }
  return { min: null, max: null, currency: null, lineIndex: -1 };
}

function parseAmount(value: string) {
  const normalized = value.replace(/,/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function parseDescription(lines: string[], budgetLineIndex: number) {
  let start = budgetLineIndex >= 0 ? budgetLineIndex + 1 : -1;
  if (start < 0) {
    const aboutIndex = lines.findIndex((line) => normalizeHeading(line) === "sobre este proyecto");
    if (aboutIndex >= 0) start = aboutIndex + 1;
  }
  if (start < 0) return null;

  const paragraphs: string[] = [];
  let current: string[] = [];
  const flush = () => {
    const paragraph = current.join(" ").replace(/\s+/g, " ").trim();
    if (paragraph) paragraphs.push(paragraph);
    current = [];
  };

  for (let index = start; index < lines.length; index += 1) {
    const rawLine = lines[index].trim();
    if (isDescriptionBoundary(rawLine)) break;
    if (!rawLine) {
      flush();
      continue;
    }
    if (/^#{1,6}\s/.test(rawLine)) continue;
    if (isStandaloneMarkdownLink(rawLine) || normalizeWorkanaProjectUrl(rawLine)) continue;

    const clean = cleanInlineMarkdown(rawLine.replace(/^[-*+]\s+/, ""));
    if (clean) current.push(clean);
  }
  flush();
  return paragraphs.length ? paragraphs.join("\n\n") : null;
}

function isDescriptionBoundary(line: string) {
  const normalized = stripDiacritics(cleanInlineMarkdown(line))
    .replace(/^#{1,6}\s*/, "")
    .trim()
    .toLowerCase();
  return /^(categoria\b|subcategoria\b|¿?cual es el alcance\b|plazo de entrega\b|habilidades necesarias\b|contacto\s*:|cliente\s*:|pais\s*:)/i.test(normalized);
}

function parseSkills(lines: string[]) {
  const sectionIndex = lines.findIndex((line) => normalizeHeading(line).startsWith("habilidades necesarias"));
  if (sectionIndex < 0) return { foundSection: false, technologies: [] as string[] };

  const technologies: string[] = [];
  const headingContent = cleanInlineMarkdown(lines[sectionIndex])
    .replace(/^#{1,6}\s*/, "")
    .replace(/^habilidades necesarias\s*:?\s*/i, "")
    .trim();
  if (headingContent) addPlainTechnologies(technologies, headingContent);

  for (let index = sectionIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;
    if (isSkillsBoundary(line)) break;

    const markdownLabels = Array.from(line.matchAll(/\[([^\]]+)]\([^)]*\)/g), (match) => cleanInlineMarkdown(match[1]));
    if (markdownLabels.length) {
      markdownLabels.forEach((label) => addTechnology(technologies, label));
      continue;
    }

    if (/^https?:\/\//i.test(line) || /^#{1,6}\s/.test(line)) continue;
    addPlainTechnologies(technologies, cleanInlineMarkdown(line.replace(/^[-*+]\s+/, "")));
  }
  return { foundSection: true, technologies };
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

function isSkillsBoundary(line: string) {
  const normalized = stripDiacritics(cleanInlineMarkdown(line)).trim().toLowerCase();
  return /^(contacto\s*:|cliente\s*:|pais\s*:|categoria\b|subcategoria\b|plazo de entrega\b)/.test(normalized)
    || Boolean(normalizeWorkanaProjectUrl(line));
}

function parseTechnologiesFromDescription(description: string | null) {
  if (!description) return [];
  const technologies: string[] = [];
  for (const [pattern, name] of explicitTechnologyPatterns) {
    if (pattern.test(description)) addTechnology(technologies, name);
  }
  return technologies;
}

function addTechnology(technologies: string[], rawName: string) {
  const trimmed = rawName.replace(/^[`*_]+|[`*_.]+$/g, "").trim();
  if (!trimmed || trimmed.length > 100 || /^https?:\/\//i.test(trimmed)) return;
  const aliasKey = trimmed.toLowerCase().replace(/\s+/g, "");
  const normalized = technologyAliases[aliasKey] ?? technologyAliases[trimmed.toLowerCase()] ?? trimmed;
  if (!technologies.some((technology) => technology.toLocaleLowerCase() === normalized.toLocaleLowerCase())) {
    technologies.push(normalized);
  }
}

function parseLabeledValue(lines: string[], label: RegExp) {
  for (const rawLine of lines) {
    const line = cleanInlineMarkdown(rawLine.replace(/^[-*+]\s+/, ""));
    if (!label.test(line)) continue;
    const value = line.replace(label, "").trim();
    return value || null;
  }
  return null;
}

function normalizeHeading(value: string) {
  return stripDiacritics(cleanInlineMarkdown(value).replace(/^#{1,6}\s*/, ""))
    .trim()
    .toLowerCase();
}

function cleanInlineMarkdown(value: string) {
  return value
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

function isStandaloneMarkdownLink(value: string) {
  return /^[-*+]?\s*\[[^\]]+]\([^)]*\)\s*$/.test(value);
}

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isValidDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
