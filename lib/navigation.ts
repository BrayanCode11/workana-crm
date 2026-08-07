import {
  FlaskConical,
  LayoutDashboard,
  ListTodo,
  Network,
  Users,
  Waypoints,
} from "lucide-react";

export const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Oportunidades", href: "/opportunities", icon: ListTodo },
  { name: "Pipeline", href: "/pipeline", icon: Waypoints },
  { name: "Seguimientos", href: "/follow-ups", icon: Network },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Experimentos", href: "/experiments", icon: FlaskConical },
] as const;
