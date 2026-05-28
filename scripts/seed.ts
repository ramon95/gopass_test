/**
 * Seed script — genera datos de demo para la presentación.
 * Uso: npx tsx scripts/seed.ts
 *
 * Crea un usuario demo y 3 proyectos con tareas distribuidas en las 3 columnas.
 * Si el usuario ya existe, reutiliza su cuenta.
 */

import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const db = new Pool({ connectionString: process.env.DATABASE_URL })

const DEMO_EMAIL    = 'demo@gopass.com'
const DEMO_PASSWORD = 'demo1234'
const DEMO_NAME     = 'Demo Gopass'

const EXTRA_USERS = [
  { name: 'Ana Martínez',  email: 'ana@gopass.com',    password: 'ana1234' },
  { name: 'Carlos López',  email: 'carlos@gopass.com', password: 'carlos1234' },
]

const PROJECTS = [
  {
    name: 'App Móvil Gopass',
    description: 'Tablero de prueba',
    tasks: [
      { title: 'Definir arquitectura del proyecto',    description: 'Elegir el stack tecnológico y estructurar los módulos principales de la aplicación.',   priority: 'high',   status: 'done' },
      { title: 'Diseñar wireframes de pantallas',      description: 'Crear prototipos de baja fidelidad para las vistas principales: home, login y perfil.',  priority: 'high',   status: 'done' },
      { title: 'Configurar entorno de desarrollo',     description: 'Instalar dependencias, configurar linters, formatters y pipeline de CI/CD.',             priority: 'medium', status: 'done' },
      { title: 'Implementar autenticación JWT',        description: 'Desarrollar el flujo de login y registro con tokens seguros en cookies httpOnly.',        priority: 'high',   status: 'in_progress' },
      { title: 'Crear módulo de pagos',                description: 'Integrar pasarela de pago y manejar estados de transacción con reintentos.',             priority: 'high',   status: 'in_progress' },
      { title: 'Integrar notificaciones push',         description: 'Configurar Firebase Cloud Messaging para alertas de transacciones y recordatorios.',     priority: 'medium', status: 'pending' },
      { title: 'Pruebas de carga en endpoints',        description: 'Ejecutar tests de estrés en los endpoints críticos para validar el rendimiento.',        priority: 'medium', status: 'pending' },
      { title: 'Publicar en App Store y Play Store',   description: 'Preparar assets, descripción y capturas de pantalla para el lanzamiento oficial.',       priority: 'low',    status: 'pending' },
    ],
  },
  {
    name: 'Portal Web Empresas',
    description: 'Plataforma B2B para clientes corporativos',
    tasks: [
      { title: 'Levantar infraestructura AWS',         description: 'Configurar VPC, subnets, RDS y balanceador de carga para el entorno de producción.',     priority: 'high',   status: 'done' },
      { title: 'Implementar dashboard de métricas',    description: 'Construir panel con gráficas de uso, consumo y facturación en tiempo real.',             priority: 'high',   status: 'in_progress' },
      { title: 'Módulo de gestión de usuarios',        description: 'CRUD de usuarios corporativos con roles de administrador, supervisor y operador.',        priority: 'medium', status: 'in_progress' },
      { title: 'Exportar reportes en PDF y Excel',     description: 'Generar reportes descargables con filtros por fecha, proyecto y estado de transacción.', priority: 'low',    status: 'pending' },
      { title: 'Auditoría y logs de actividad',        description: 'Registrar acciones críticas de usuarios para trazabilidad y cumplimiento regulatorio.',  priority: 'medium', status: 'pending' },
    ],
  },
  {
    name: 'Rediseño de Landing',
    description: 'Mejoras de conversión y rendimiento',
    tasks: [
      { title: 'Análisis de métricas actuales',        description: 'Revisar bounce rate, tiempo en página y embudos de conversión en Google Analytics.',    priority: 'medium', status: 'done' },
      { title: 'Nuevas secciones Hero y CTA',          description: 'Rediseñar el bloque principal con copy más directo y botones de llamada a la acción.',   priority: 'high',   status: 'done' },
      { title: 'Optimizar imágenes y fuentes',         description: 'Convertir assets a WebP, aplicar lazy loading y precargar fuentes críticas.',            priority: 'medium', status: 'in_progress' },
      { title: 'Implementar A/B testing',              description: 'Configurar experimentos con dos variantes del hero para medir tasa de conversión.',      priority: 'low',    status: 'pending' },
    ],
  },
]

async function seed() {
  console.log('🌱  Iniciando seed...\n')

  // Obtener o crear usuario demo
  let userId: string
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [DEMO_EMAIL])

  if (existing.rows.length > 0) {
    userId = existing.rows[0].id
    await db.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', userId])
    console.log(`✓  Usuario demo ya existe (${DEMO_EMAIL})`)
  } else {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 12)
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [DEMO_NAME, DEMO_EMAIL, hash, 'admin']
    )
    userId = rows[0].id
    console.log(`✓  Usuario demo creado → ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
  }

  // Crear usuarios extra para probar asignación
  const extraIds: string[] = []
  for (const u of EXTRA_USERS) {
    const ex = await db.query('SELECT id FROM users WHERE email = $1', [u.email])
    if (ex.rows.length > 0) {
      extraIds.push(ex.rows[0].id)
      console.log(`✓  Usuario ya existe (${u.email})`)
    } else {
      const hash = await bcrypt.hash(u.password, 12)
      const { rows } = await db.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [u.name, u.email, hash]
      )
      extraIds.push(rows[0].id)
      console.log(`✓  Usuario creado → ${u.email} / ${u.password}`)
    }
  }

  for (const project of PROJECTS) {
    // Verificar si el proyecto ya existe para este usuario
    const existingProj = await db.query(
      'SELECT id FROM projects WHERE owner_id = $1 AND name = $2',
      [userId, project.name]
    )
    if (existingProj.rows.length > 0) {
      console.log(`⏭   Proyecto "${project.name}" ya existe, omitiendo.`)
      continue
    }

    const { rows: [proj] } = await db.query(
      'INSERT INTO projects (owner_id, name, description) VALUES ($1, $2, $3) RETURNING id',
      [userId, project.name, project.description]
    )

    // Contadores de orden por columna
    // Agregar usuarios extra como miembros del proyecto
    for (const memberId of extraIds) {
      await db.query(
        'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [proj.id, memberId]
      )
    }

    const orderMap: Record<string, number> = { pending: 0, in_progress: 0, done: 0 }

    for (let i = 0; i < project.tasks.length; i++) {
      const task = project.tasks[i]
      const order = orderMap[task.status]++
      // Distribuir asignaciones entre los usuarios extra
      const assignedTo = extraIds.length > 0 && i % 3 !== 0 ? extraIds[i % extraIds.length] : null
      await db.query(
        `INSERT INTO tasks (project_id, assigned_to, title, description, priority, status, "order")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [proj.id, assignedTo, task.title, task.description, task.priority, task.status, order]
      )
    }

    console.log(`✓  Proyecto "${project.name}" creado con ${project.tasks.length} tareas`)
  }

  console.log('\n✅  Seed completado.')
  console.log(`\n   ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
  for (const u of EXTRA_USERS) {
    console.log(`   ${u.email} / ${u.password}`)
  }
  console.log()

  await db.end()
}

seed().catch((err) => {
  console.error('❌  Error en seed:', err)
  process.exit(1)
})
