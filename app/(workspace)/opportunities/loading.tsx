export default function OpportunitiesLoading() {
  return (
    <div aria-label="Cargando oportunidades" aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-subtitle" />
      <div className="skeleton skeleton-panel" />
    </div>
  );
}

