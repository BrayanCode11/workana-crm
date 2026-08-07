export default function PipelineLoading() {
  return (
    <div aria-label="Cargando pipeline" aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-subtitle" />
      <div className="skeleton skeleton-panel" />
    </div>
  );
}

