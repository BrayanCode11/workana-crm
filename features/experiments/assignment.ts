export type AssignableVariant = { id: string; code: string; created_at: string };

export function chooseLeastUsedVariant(
  variants: AssignableVariant[],
  assignments: Array<{ experiment_variant_id: string | null }>,
) {
  const counts = new Map<string, number>();
  assignments.forEach(({ experiment_variant_id }) => {
    if (experiment_variant_id) counts.set(experiment_variant_id, (counts.get(experiment_variant_id) ?? 0) + 1);
  });
  return [...variants].sort((left, right) =>
    (counts.get(left.id) ?? 0) - (counts.get(right.id) ?? 0)
      || left.created_at.localeCompare(right.created_at)
      || left.code.localeCompare(right.code, "es")
      || left.id.localeCompare(right.id),
  )[0] ?? null;
}
