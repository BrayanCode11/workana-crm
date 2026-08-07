export default function ExperimentsLoading() {
  return (
    <div aria-label="Cargando experimentos" aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-subtitle" />
      <div className="skeleton skeleton-panel" />
    </div>
  );
}
