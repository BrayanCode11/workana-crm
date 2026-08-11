# Prospecta

CRM personal, simple y enfocado en organizar la prospección, los seguimientos y el cierre de proyectos en Workana.

**Producción:** [workana-crm.vercel.app](https://workana-crm.vercel.app)

## Estado actual

La aplicación funcional incluye:

- Next.js con App Router, React y TypeScript estricto.
- Tailwind CSS y un sistema visual responsive propio.
- Navegación principal para Dashboard, Oportunidades, Pipeline, Seguimientos, Clientes y Experimentos.
- Estados vacíos, carga progresiva, recuperación de errores y feedback accesible.
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
- Cierres ganados y perdidos con valor final, moneda, fecha, motivo y observaciones validadas.
- Hitos comerciales históricos inmutables aunque una oportunidad vuelva a una etapa anterior.
- Experimentos con estados, variantes activables y analítica comparativa basada en hitos reales.
- Asignación automática y balanceada de variantes para las nuevas oportunidades.
- Importador local de publicaciones de Workana con preview editable.
- Contexto estructurado copiable para usar manualmente en ChatGPT, sin APIs ni claves de modelos.
- Consulta inicial, seguimiento 1 y seguimiento 2 preparados y editables por oportunidad.
- Historial separado de mensajes comerciales realmente enviados y recibidos.
- Tasas por variante acompañadas por su muestra y valores ganados agrupados por moneda.
- Dashboard operativo con KPIs históricos, agenda prioritaria, pipeline y resumen de clientes.
- Navegación por teclado, alternativa al drag and drop, foco controlado y acciones móviles contextuales.
- Pruebas automatizadas para métricas y fechas, además de lint, typecheck y build.

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
npm run typecheck  # generación de tipos de rutas y comprobación de TypeScript
npm test           # pruebas de métricas y fechas
npm run build      # build de producción
npm run start      # ejecutar el build
npm run smoke:production -- https://workana-crm.vercel.app
npm run db:push    # aplicar migraciones al proyecto Supabase enlazado
npm run db:lint    # analizar el esquema PostgreSQL
```

## Variables de entorno

El archivo `.env.example` documenta las variables sin incluir secretos:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Usa `.env.local` para valores reales. Los archivos `.env*`, excepto `.env.example`, están ignorados por Git. El CRM no utiliza proveedores de modelos ni necesita claves de IA.

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
  (workspace)/          Área privada del CRM
components/             Componentes visuales compartidos
features/               Lógica, consultas, acciones y UI por módulo
lib/                    Configuración y utilidades sin UI
  supabase/             Clientes browser, server y renovación de sesión
public/                 Recursos estáticos
supabase/               Configuración local y migraciones versionadas
proxy.ts                Renovación de sesión y redirects optimistas
```

Se prefieren Server Components. Los Client Components se reservan para formularios interactivos, navegación móvil, diálogos y drag and drop.

## Base de datos

El modelo incluye perfiles, clientes, oportunidades, notas, mensajes comerciales, mensajes preparados, experimentos, variantes y motivos de pérdida. `client_id` es opcional; las tecnologías son un arreglo simple de texto y las monedas nunca se agregan entre sí sin agruparlas.

## Flujo Workana y ChatGPT manual

1. Pega la publicación en **Pegar desde Workana**, analiza y revisa el preview.
2. Crea la oportunidad; el CRM asigna automáticamente la variante activa menos utilizada del experimento predeterminado.
3. En el detalle, usa **Copiar para ChatGPT** y pega el contexto en tu chat especializado.
4. Copia de vuelta la Consulta, F1 y F2 en **Mensajes preparados** y guárdalos una sola vez.
5. Cuando corresponda, copia el texto, envíalo manualmente en Workana y confirma la acción real en el CRM.

Guardar o copiar mensajes preparados no cambia etapas, fechas, historial ni métricas. Solamente **Consulta enviada**, **Seguimiento 1 enviado**, **Seguimiento 2 enviado** y **Registrar respuesta** alteran la cadencia o el historial comercial. F1 se programa a 24 horas y F2 a 48 horas desde el primer contacto.

Las relaciones compuestas garantizan que cliente, oportunidad, nota, experimento y variante pertenezcan al mismo usuario. Los clientes con oportunidades no pueden eliminarse accidentalmente. Los timestamps comerciales se registran la primera vez que se alcanza cada evento y se conservan aunque cambie la etapa actual.

## Build y despliegue

Antes de cada entrega importante se ejecutan tests, lint, typecheck y build. El workflow `Quality` repite estas comprobaciones en GitHub para cada pull request y cada push a `main`.

La rama `main` está conectada a Vercel; cada publicación inicia un nuevo despliegue de producción. En **Vercel → Project → Settings → Environment Variables** deben existir estas variables para `Production` y, si se usan despliegues de revisión, también para `Preview`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Después de cambiar una variable hay que volver a desplegar: las variables `NEXT_PUBLIC_*` quedan incorporadas durante el build. Los valores reales nunca se incluyen en el repositorio.

En **Supabase → Authentication → URL Configuration**, la **Site URL** es `https://workana-crm.vercel.app`. Los redirects autorizados son la misma URL exacta de producción y `http://localhost:3000/**` para desarrollo.

Tras un despliegue, ejecuta la prueba pública sin credenciales:

```bash
npm run smoke:production -- https://workana-crm.vercel.app
```

La prueba confirma HTTPS, protección de rutas, login, encabezados de seguridad y bloqueo de indexación. El flujo autenticado (login, alta y edición de una oportunidad, seguimiento y cierre de sesión) se valida manualmente con una cuenta real, sin almacenar su contraseña.

Las funciones de Vercel se ejecutan en Portland (`pdx1`), la región equivalente a `us-west-2` donde reside Supabase. La validación de sesión del DAL se memoiza durante cada render para evitar verificaciones repetidas entre layouts y consultas sin reducir la autorización en servidor.
