"use client";

import { Menu, Plus, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigation } from "@/lib/navigation";

function Brand() {
  return (
    <Link className="brand" href="/dashboard" aria-label="Ir al dashboard">
      <span className="brand-mark" aria-hidden="true">
        W
      </span>
      <span>
        <strong>Prospecta</strong>
        <small>CRM para Workana</small>
      </span>
    </Link>
  );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav" aria-label="Navegación principal">
      <p className="nav-label">Espacio de trabajo</p>
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            className={isActive ? "nav-link nav-link-active" : "nav-link"}
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand />
        </div>
        <Navigation />
        <div className="sidebar-footer">
          <span className="status-dot" aria-hidden="true" />
          <span>Base local preparada</span>
        </div>
      </aside>

      <div className="mobile-header">
        <Brand />
        <button
          className="icon-button"
          type="button"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={20} />
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu-layer" role="dialog" aria-modal="true" aria-label="Menú">
          <button
            className="mobile-menu-backdrop"
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="mobile-menu-panel">
            <div className="mobile-menu-heading">
              <Brand />
              <button
                className="icon-button"
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <Navigation onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <main className="main-content">
        <div className="content-frame">{children}</div>
      </main>

      <Link className="mobile-create-button" href="/opportunities/new">
        <Plus size={18} aria-hidden="true" />
        <span>Nueva oportunidad</span>
      </Link>
    </div>
  );
}
