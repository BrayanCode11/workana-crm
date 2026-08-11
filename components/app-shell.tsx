"use client";

import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { logout } from "@/app/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";
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

const sidebarStorageKey = "prospecta-sidebar";

function subscribeSidebarPreference(onStoreChange: () => void) {
  window.addEventListener("prospecta-sidebar-change", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("prospecta-sidebar-change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSidebarSnapshot() {
  return localStorage.getItem(sidebarStorageKey) === "collapsed";
}

function Navigation({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
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
            aria-label={collapsed ? item.name : undefined}
            title={collapsed ? item.name : undefined}
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
  const sidebarCollapsed = useSyncExternalStore(subscribeSidebarPreference, getSidebarSnapshot, () => false);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLElement>(null);
  const mobileAction = getMobileAction(pathname);

  function toggleSidebar() {
    const nextValue = sidebarCollapsed ? "expanded" : "collapsed";
    localStorage.setItem(sidebarStorageKey, nextValue);
    window.dispatchEvent(new Event("prospecta-sidebar-change"));
  }

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [menuOpen]);

  function trapMenuFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = menuPanelRef.current?.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? "app-shell-sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>
      <aside className="sidebar" id="desktop-sidebar">
        <div className="sidebar-brand">
          <Brand />
          <button
            aria-controls="desktop-sidebar"
            aria-expanded={!sidebarCollapsed}
            aria-label={sidebarCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            className="sidebar-toggle"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Expandir menú" : "Contraer menú"}
            type="button"
          >
            {sidebarCollapsed
              ? <PanelLeftOpen size={16} aria-hidden="true" />
              : <PanelLeftClose size={16} aria-hidden="true" />}
          </button>
        </div>
        <Navigation collapsed={sidebarCollapsed} />
        <div className="sidebar-footer">
          <ThemeToggle compact={sidebarCollapsed} />
          <form action={logout}>
            <button className="logout-button" type="submit" aria-label="Cerrar sesión" title={sidebarCollapsed ? "Cerrar sesión" : undefined}>
              <LogOut size={15} strokeWidth={1.8} aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      <div className="mobile-header">
        <Brand />
        <button
          className="icon-button"
          ref={menuButtonRef}
          type="button"
          aria-label="Abrir menú"
          aria-controls="mobile-menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={20} />
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu-layer" id="mobile-menu" role="dialog" aria-modal="true" aria-labelledby="mobile-menu-title" onKeyDown={trapMenuFocus}>
          <button
            className="mobile-menu-backdrop"
            type="button"
            tabIndex={-1}
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="mobile-menu-panel" ref={menuPanelRef}>
            <div className="mobile-menu-heading">
              <h2 className="sr-only" id="mobile-menu-title">Navegación principal</h2>
              <Brand />
              <button
                className="icon-button"
                ref={closeButtonRef}
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <Navigation onNavigate={() => setMenuOpen(false)} />
            <div className="mobile-account-actions">
              <ThemeToggle />
              <form action={logout} className="mobile-logout-form">
                <button className="logout-button" type="submit">
                  <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      <main className="main-content" id="main-content" tabIndex={-1}>
        <div className="content-frame">{children}</div>
      </main>

      {mobileAction && (
        <Link className="mobile-create-button" href={mobileAction.href}>
          <Plus size={18} aria-hidden="true" />
          <span>{mobileAction.label}</span>
        </Link>
      )}
    </div>
  );
}

function getMobileAction(pathname: string) {
  if (pathname.endsWith("/new") || pathname.endsWith("/edit") || pathname.endsWith("/import")) return null;
  if (pathname === "/clients") return { href: "/clients/new", label: "Nuevo cliente" };
  if (pathname === "/experiments") return { href: "/experiments/new", label: "Nuevo experimento" };

  const clientDetail = pathname.match(/^\/clients\/([^/]+)$/);
  if (clientDetail) {
    return { href: `/opportunities/new?client=${clientDetail[1]}`, label: "Nueva oportunidad" };
  }

  const experimentDetail = pathname.match(/^\/experiments\/([^/]+)$/);
  if (experimentDetail) {
    return { href: `/experiments/${experimentDetail[1]}/variants/new`, label: "Nueva variante" };
  }

  return { href: "/opportunities/new", label: "Nueva oportunidad" };
}
