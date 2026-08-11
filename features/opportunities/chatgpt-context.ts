export type ChatGPTContextInput = {
  title?: string | null;
  contact_name?: string | null;
  contact_country?: string | null;
  published_budget_min?: number | null;
  published_budget_max?: number | null;
  published_budget_currency?: string | null;
  published_at?: string | null;
  technologies?: string[] | null;
  description?: string | null;
  workana_url?: string | null;
  experiment?: { name: string | null } | null;
  variant?: { code: string | null; name: string | null } | null;
};

function clean(value: string | null | undefined) {
  return value?.trim() || null;
}

function formatAmount(value: number, currency: string) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function formatBudget(input: ChatGPTContextInput) {
  const currency = clean(input.published_budget_currency);
  const min = input.published_budget_min;
  const max = input.published_budget_max;
  if (!currency || (min == null && max == null)) return null;
  if (min != null && max != null) return min === max
    ? formatAmount(min, currency)
    : `${formatAmount(min, currency)} – ${formatAmount(max, currency)}`;
  if (min != null) return `Desde ${formatAmount(min, currency)}`;
  return `Hasta ${formatAmount(max!, currency)}`;
}

function formatPublishedDate(value: string | null | undefined) {
  const raw = clean(value);
  if (!raw) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00-05:00` : raw);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(date);
}

function field(label: string, value: string | null) {
  return value ? `${label}:\n${value}` : null;
}

export function formatChatGPTContext(input: ChatGPTContextInput) {
  const sections: string[] = [];
  const experimentName = clean(input.experiment?.name);
  if (experimentName) {
    sections.push(`EXPERIMENTO\n${experimentName}`);
    const variantCode = clean(input.variant?.code);
    const variantName = clean(input.variant?.name);
    if (variantCode || variantName) {
      sections.push(`VARIANTE\n${[variantCode, variantName].filter(Boolean).join(" — ")}`);
    }
  }

  const projectFields = [
    field("Título", clean(input.title)),
    field("Contacto", clean(input.contact_name)),
    field("País", clean(input.contact_country)),
    field("Presupuesto", formatBudget(input)),
    field("Publicado", formatPublishedDate(input.published_at)),
    field("Tecnologías", input.technologies?.map((item) => item.trim()).filter(Boolean).join(", ") || null),
    field("Descripción", clean(input.description)),
    field("URL", clean(input.workana_url)),
  ].filter((value): value is string => Boolean(value));
  sections.push(`PROYECTO${projectFields.length ? `\n\n${projectFields.join("\n\n")}` : ""}`);
  return sections.join("\n\n");
}
