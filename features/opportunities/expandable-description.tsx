"use client";

import { useState } from "react";

const previewLimit = 520;

function createPreview(description: string) {
  const candidate = description.slice(0, previewLimit);
  const lastSpace = candidate.lastIndexOf(" ");
  return `${candidate.slice(0, lastSpace > previewLimit * 0.75 ? lastSpace : previewLimit).trimEnd()}…`;
}

export function ExpandableDescription({ description }: { description: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const value = description?.trim();
  if (!value) return <p>No hay una descripción registrada.</p>;
  if (value.length <= previewLimit) return <p>{value}</p>;

  return (
    <div className="expandable-description">
      <p>{expanded ? value : createPreview(value)}</p>
      <button
        aria-expanded={expanded}
        className="expandable-description-toggle"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        {expanded ? "Contraer" : "Extender"}
      </button>
    </div>
  );
}
