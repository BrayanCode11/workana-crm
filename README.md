# Prospecta

CRM personal, simple y enfocado en organizar la prospección, los seguimientos y el cierre de proyectos en Workana.

## Estado actual

La base visual y la infraestructura de Supabase están terminadas. El proyecto incluye:

- Next.js con App Router, React y TypeScript estricto.
- Tailwind CSS y un sistema visual responsive propio.
- Navegación principal para Dashboard, Oportunidades, Pipeline, Seguimientos, Clientes y Experimentos.
- Estados vacíos y estructuras iniciales de tabla, métricas y Kanban.
- Sesiones de Supabase Auth almacenadas en cookies.
- Login privado, logout, renovación de sesión y protección de rutas.
- Esquema PostgreSQL versionado con integridad referencial y RLS.
- Clientes: listado, búsqueda, creación, edición, detalle y eliminación protegida.
- Métricas de clientes calculadas desde oportunidades y agrupadas por moneda.
- Oportunidades: listado con búsqueda y filtros, creación, edición, detalle y eliminación.
- Creación rápida de clientes desde una oportunidad y atribución a experimentos/variantes.
- Cambio de etapa con timestamps automáticos y cierres ganado/perdido validados.
- Validación de formularios complejos con Zod antes de escribir en PostgreSQL.
- Notas de oportunidad en texto simple con creación, edición, eliminación y orden cronológico inverso.
- Seguimientos agrupados en vencidos, hoy y próximos, con registro, reprogramación y cierre rápido.
- Pipeline Kanban con arrastre por puntero/teclado, actualización optimista, rollback y selector accesible.
- ESLint y comandos separados para lint, typecheck y build.

Los módulos CRUD se incorporarán progresivamente sobre esta base segura.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React
- Supabase
- Zod
- Vercel

## Requisitos

- Node.js 20.9 o superior. El proyecto fue inicializado con Node.js 22.23.1.
- npm 10 o superior.

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Las variables de Supabase deben apuntar al proyecto configurado.

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm run lint       # análisis estático
npm run typecheck  # comprobación de TypeScript
npm run build      # build de producción
npm run start      # ejecutar el build
npm run db:push    # aplicar migraciones al proyecto Supabase enlazado
npm run db:lint    # analizar el esquema PostgreSQL
```

## Variables de entorno

El archivo `.env.example` documenta las variables sin incluir secretos:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Usa `.env.local` para valores reales. Los archivos `.env*`, excepto `.env.example`, están ignorados por Git.

## Supabase

Las migraciones versionadas viven en `supabase/migrations/` e incluyen tablas, constraints, índices, catálogo de motivos de pérdida, triggers comerciales y políticas RLS. No se crean tablas manualmente sin una migración equivalente.

La autenticación usa Supabase Auth con sesiones SSR en cookies. `proxy.ts` renueva la sesión y realiza redirecciones tempranas; `lib/auth.ts` verifica acceso en servidor y RLS garantiza que cada cuenta solo acceda a sus propios registros.

En el proyecto alojado, revisa **Authentication → Sign In / Providers → Email** y mantén habilitado el proveedor Email. El registro público está desactivado; los usuarios se crean manualmente desde **Authentication → Users** y deben tener el correo confirmado.

Para trabajar contra un proyecto remoto:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npm run db:push
```

No guardes el access token, la contraseña de PostgreSQL ni claves `secret`/`service_role` en el repositorio.

## Arquitectura

```text
app/                    Rutas, layouts y estilos globales
  (workspace)/          Área privada del CRM (protección en Fase 3)
components/             Componentes visuales compartidos
lib/                    Configuración y utilidades sin UI
  supabase/             Clientes browser, server y renovación de sesión
public/                 Recursos estáticos
supabase/               Configuración local y migraciones versionadas
proxy.ts                Renovación de sesión y redirects optimistas
```

Se prefieren Server Components. Los Client Components se reservan para navegación móvil y futuras interacciones que requieran estado del navegador.

## Base de datos y modelo previsto

El modelo incluye perfiles, clientes, oportunidades, notas, experimentos, variantes y motivos de pérdida. `client_id` es opcional; las tecnologías son un arreglo simple de texto y las monedas nunca se agregan entre sí sin agruparlas.

Las relaciones compuestas garantizan que cliente, oportunidad, nota, experimento y variante pertenezcan al mismo usuario. Los clientes con oportunidades no pueden eliminarse accidentalmente. Los timestamps comerciales se registran la primera vez que se alcanza cada evento y se conservan aunque cambie la etapa actual.

## Build y despliegue

Antes de cada entrega importante se ejecutan lint, typecheck y build. El despliegue en Vercel se realizará al final, después de validar autenticación, RLS y flujos funcionales en local. Las variables de Supabase se configurarán separadamente en Vercel y nunca se incluirán en el repositorio.
