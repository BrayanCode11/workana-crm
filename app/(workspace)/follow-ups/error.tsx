"use client";

import { RouteError } from "@/components/route-error";

export default function FollowUpsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError error={error} retry={retry} title="No pudimos cargar los seguimientos" />;
}
