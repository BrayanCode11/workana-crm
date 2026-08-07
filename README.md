# Prospecta

CRM personal, simple y enfocado en organizar la prospección, los seguimientos y el cierre de proyectos en Workana.

## Estado actual

La Fase 0 y la base del sistema visual están terminadas. El proyecto incluye:

- Next.js con App Router, React y TypeScript estricto.
- Tailwind CSS y un sistema visual responsive propio.
- Navegación principal para Dashboard, Oportunidades, Pipeline, Seguimientos, Clientes y Experimentos.
- Estados vacíos y estructuras iniciales de tabla, métricas y Kanban.
- ESLint y comandos separados para lint, typecheck y build.

La persistencia, autenticación y funcionalidad CRUD se incorporarán a partir de la conexión con Supabase.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React
- Supabase (próxima fase)
- Vercel (despliegue futuro)

## Requisitos

- Node.js 20.9 o superior. El proyecto fue inicializado con Node.js 22.23.1.
- npm 10 o superior.

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Por ahora las variables de Supabase pueden permanecer vacías.

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm run lint       # análisis estático
npm run typecheck  # comprobación de TypeScript
npm run build      # build de producción
npm run start      # ejecutar el build
```

## Variables de entorno

El archivo `.env.example` documenta las variables sin incluir secretos:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Usa `.env.local` para valores reales. Los archivos `.env*`, excepto `.env.example`, están ignorados por Git.

## Supabase

Supabase se configurará en la Fase 2. Las migraciones versionadas vivirán en `supabase/migrations/` e incluirán tablas, constraints, índices, catálogo de motivos de pérdida y políticas RLS. No se crearán tablas manualmente sin una migración equivalente.

La autenticación usará Supabase Auth con rutas privadas. Cada tabla de usuario tendrá Row Level Security para que cada cuenta solo acceda a sus propios registros.

## Arquitectura

```text
app/                    Rutas, layouts y estilos globales
  (workspace)/          Área privada del CRM (protección en Fase 3)
components/             Componentes visuales compartidos
lib/                    Configuración y utilidades sin UI
public/                 Recursos estáticos
supabase/               Migraciones y configuración (Fase 2)
```

Se prefieren Server Components. Los Client Components se reservan para navegación móvil y futuras interacciones que requieran estado del navegador.

## Base de datos y modelo previsto

El modelo se implementará después de revisarlo en la Fase 2. Sus entidades centrales serán perfiles, clientes, oportunidades, notas, experimentos, variantes y motivos de pérdida. `client_id` será opcional; las tecnologías se mantendrán como un arreglo simple de texto y las monedas nunca se agregarán entre sí sin agruparlas.

## Build y despliegue

Antes de cada entrega importante se ejecutan lint, typecheck y build. El despliegue en Vercel se realizará al final, después de validar autenticación, RLS y flujos funcionales en local. Las variables de Supabase se configurarán separadamente en Vercel y nunca se incluirán en el repositorio.
