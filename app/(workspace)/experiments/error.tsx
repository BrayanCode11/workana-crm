"use client";

import { RouteError } from "@/components/route-error";

export default function ExperimentsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError error={error} retry={retry} title="No pudimos cargar los experimentos" />;
}
