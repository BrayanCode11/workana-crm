export default function ClientsLoading() {
  return (
    <div aria-label="Cargando clientes" aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-subtitle" />
      <div className="skeleton skeleton-panel" />
    </div>
  );
}
