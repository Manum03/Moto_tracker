# Mi Moto — Gestión integral

App personal (mobile-first) para llevar el mantenimiento, los documentos legales y el crédito de tu motocicleta al día, con un dashboard tipo semáforo (verde/amarillo/rojo).

## Stack

- **Next.js 16 (App Router) + TypeScript** — UI y API routes en un solo proyecto.
- **Prisma ORM + SQLite** (`prisma/dev.db`) — base de datos basada en archivo, cero configuración.
- **Tailwind CSS v4** — UI mobile-first.
- **node-cron / tsx** — job de background para las notificaciones.

## Módulos

1. **Vehículo**: registro de placa, marca, modelo, cilindraje, fecha de compra y odómetro virtual.
2. **Legal y documentos**: SOAT y Revisión Técnico-Mecánica (RTM), con alertas a 15 y 3 días del vencimiento.
3. **Mantenimiento preventivo**: aceite (2.500 km / 6 meses, lo que ocurra primero), cadena (500 km), pastillas de freno, líquido de frenos y presión de llantas, más un historial (CRUD) de mantenimientos realizados.
4. **Crédito**: registro del crédito y generación automática de cuotas, con notificación 2 días antes de cada vencimiento.

## 1. Instalación

```bash
npm install
cp .env.example .env
```

Revisa `.env` — por defecto `NOTIFICATION_CHANNEL="console"`, que imprime las alertas en la terminal (no requiere configuración adicional).

## 2. Base de datos y migraciones

```bash
npm run db:migrate
```

Esto crea `prisma/dev.db` y aplica el schema (motocicleta, documentos, reglas y logs de mantenimiento, crédito/cuotas, y el registro de notificaciones enviadas). Cada vez que cambies `prisma/schema.prisma`, vuelve a correr este comando para generar una nueva migración.

Para inspeccionar/editar los datos con una UI:

```bash
npm run db:studio
```

## 3. Levantar la app

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Empieza registrando tu moto en la pestaña **Vehículo**; luego el dashboard de **Inicio** mostrará el semáforo general.

## 4. Probar el sistema de notificaciones

Las notificaciones son independientes del servidor web: viven en `scripts/check-alerts.ts` y usan la misma lógica que expone `src/lib/alert-checker.ts` (documentos a 15/3 días, mantenimiento cuando entra en amarillo/rojo, cuotas de crédito desde 2 días antes). Cada alerta se registra en la tabla `NotificationLog` para no reenviarse dos veces; si renuevas un documento o registras el mantenimiento correspondiente, esa alerta se limpia automáticamente y puede volver a dispararse en el siguiente ciclo.

**Prueba rápida (recomendada):**

1. Registra tu moto, y crea un documento (SOAT/RTM) con fecha de vencimiento a 2-3 días, o un crédito cuya primera cuota caiga en 1-2 días.
2. Corre una sola vez el chequeo:
   ```bash
   npm run cron:once
   ```
   Deberías ver en la terminal algo como:
   ```
   🔴 [RED] SOAT por vencer — SOAT de ABC12D vence en 2 día(s).
   ```
3. Vuelve a correrlo (`npm run cron:once`): no debe reenviar nada, porque ya quedó registrado en `NotificationLog`.

**Dejarlo corriendo en segundo plano** (revisa diario a las 8am, configurable con `CRON_SCHEDULE` en `.env`):

```bash
npm run cron:watch
```

**Alternativa vía cron externo / Vercel Cron**: en lugar del proceso long-running, puedes disparar `GET/POST /api/cron/check-alerts` desde cualquier cron externo (protegido opcionalmente con `CRON_SECRET`, enviado como header `x-cron-secret` o query `?secret=`).

### Conectar un canal real de notificación

El sistema está desacoplado por diseño (`src/lib/notifications/`): cualquier canal implementa la interfaz `NotificationProvider` (`send(payload)`).

- **Telegram** (recomendado para probar rápido, sin servidor SMTP): crea un bot con [@BotFather](https://t.me/BotFather), obtén el `chat_id` hablándole al bot y consultando `https://api.telegram.org/bot<token>/getUpdates`. Luego en `.env`:
  ```
  NOTIFICATION_CHANNEL="telegram"
  TELEGRAM_BOT_TOKEN="..."
  TELEGRAM_CHAT_ID="..."
  ```
- **Email (SMTP)**: completa `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` y `NOTIFICATION_EMAIL_TO`, y pon `NOTIFICATION_CHANNEL="email"`.
- **Web Push u otro canal**: crea `src/lib/notifications/providers/tu-canal.provider.ts` implementando `NotificationProvider`, y regístralo en `src/lib/notifications/index.ts`.
- Puedes combinar varios a la vez: `NOTIFICATION_CHANNEL="console,telegram"`.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta la app en modo desarrollo |
| `npm run build` / `npm run start` | Build de producción y arranque |
| `npm run lint` | Linter |
| `npm run db:migrate` | Aplica migraciones de Prisma |
| `npm run db:studio` | UI para explorar/editar la base de datos |
| `npm run cron:once` | Corre el chequeo de alertas una sola vez (pruebas) |
| `npm run cron:watch` | Deja el chequeo de alertas corriendo en segundo plano |
