# Gopass Manager

Aplicación de gestión de proyectos y tareas. Prueba técnica Senior Full Stack Developer.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 App Router + React 19 + TypeScript |
| Backend | Next.js Route Handlers (Node.js) |
| Base de datos | PostgreSQL + `pg` driver (SQL crudo, sin ORM) |
| Autenticación | JWT con `httpOnly` cookies (`jose` — Edge Runtime) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Estado servidor | TanStack Query v5 (optimistic updates) |
| Estilos | Tailwind CSS v4 |
| Deploy | Vercel (app) + Railway (PostgreSQL) |

## Funcionalidades

- Autenticación con JWT en cookies httpOnly
- Roles: **admin** (crea y gestiona proyectos) y **user** (accede a proyectos asignados)
- CRUD completo de proyectos y tareas
- Tablero con columnas: Pendiente · En progreso · Completado
- Drag & drop entre columnas con actualización optimista en el frontend
- Asignación de usuarios a proyectos y tareas
- Validaciones en frontend (contadores de caracteres) y backend
- Confirmación antes de eliminar proyectos con tareas pendientes

## Requisitos previos

- Node.js 18+
- pnpm
- PostgreSQL 14+

## Instalación local

**1. Clonar el repositorio**

```bash
git clone <repo-url>
cd gopass_test
```

**2. Instalar dependencias**

```bash
pnpm install
```

**3. Variables de entorno**

```bash
cp .env.example .env.local
```

Editar `.env.local`:

```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/taskmanager
JWT_SECRET=una_clave_secreta_de_minimo_32_caracteres
JWT_EXPIRES_IN=7d
```

**4. Crear la base de datos y ejecutar migraciones**

```bash
createdb taskmanager

psql $DATABASE_URL -f migrations/001_initial_schema.sql
psql $DATABASE_URL -f migrations/002_project_members.sql
psql $DATABASE_URL -f migrations/003_user_roles.sql
```

**5. Cargar datos de ejemplo**

```bash
pnpm seed
```

**6. Iniciar el servidor de desarrollo**

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Usuarios de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `demo@gopass.com` | `demo1234` |
| Usuario | `ana@gopass.com` | `ana1234` |
| Usuario | `carlos@gopass.com` | `carlos1234` |

El usuario **admin** puede crear proyectos, gestionarlos y agregar miembros. Los usuarios **ana** y **carlos** solo ven los proyectos a los que fueron asignados y pueden crear/editar tareas dentro de ellos.

## Scripts disponibles

```bash
pnpm dev      # Servidor de desarrollo
pnpm build    # Build de producción
pnpm start    # Iniciar build de producción
pnpm seed     # Cargar datos de demo en la BD
```

## API REST

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login → JWT en cookie httpOnly |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/me` | Usuario autenticado actual |

### Proyectos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/projects` | Lista proyectos (filtrada por rol) |
| POST | `/api/projects` | Crear proyecto (solo admin) |
| GET | `/api/projects/:id` | Proyecto + tareas + miembros |
| PATCH | `/api/projects/:id` | Editar proyecto (solo owner) |
| DELETE | `/api/projects/:id` | Eliminar proyecto (solo owner) |
| GET | `/api/projects/:id/members` | Miembros del proyecto |
| POST | `/api/projects/:id/members` | Agregar miembro (solo owner) |
| DELETE | `/api/projects/:id/members/:userId` | Quitar miembro (solo owner) |

### Tareas
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/tasks` | Crear tarea |
| PATCH | `/api/tasks/:id` | Editar tarea |
| DELETE | `/api/tasks/:id` | Eliminar tarea |
| PATCH | `/api/tasks/:id/move` | Mover tarea entre columnas (transacción SQL) |

### Usuarios
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/users` | Lista todos los usuarios |

## Decisiones técnicas

**`jose` en lugar de `jsonwebtoken`**
El middleware de Next.js corre en Edge Runtime, que no soporta el módulo `crypto` de Node.js. `jose` usa la Web Crypto API nativa y funciona en ambos entornos.

**Transacción SQL en `/move`**
El reordenamiento del Kanban requiere 4 pasos atómicos: leer posición actual → cerrar hueco en columna origen → abrir hueco en columna destino → actualizar la tarea. Sin transacción, una falla parcial dejaría el orden corrupto.

**`UNIQUE INDEX (project_id, status, order)`**
Garantiza la integridad del ordenamiento a nivel de base de datos, no solo en la aplicación. Previene colisiones de orden bajo operaciones concurrentes.

**Optimistic updates en drag & drop**
La UI refleja el movimiento de la tarea de forma inmediata antes de que el servidor responda. Si el servidor falla, se revierte automáticamente al estado anterior.

**Pool pg singleton**
En desarrollo con hot reload, cada cambio puede crear una nueva instancia del módulo. El patrón `globalThis._pgPool` garantiza una sola conexión al pool sin importar cuántas veces se recargue el módulo.
