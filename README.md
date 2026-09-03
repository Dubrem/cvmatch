# MatchCV

Plataforma de diagnóstico gratuito de compatibilidad (match) contra una vacante objetivo, análisis estilo ATS con IA (Gemini), y generación de CV optimizado en PDF.

## Stack

- **Next.js 16** (App Router, TypeScript) + Tailwind CSS v4
- **Google Gemini API** (`@google/generative-ai`) para el análisis de match ATS
- **jsPDF** para generar el CV en PDF de una columna, limpio para ATS
- **Postgres** (`pg`) para visitas, compras, cuentas de cliente y CVs guardados
- **Stripe** para el checkout con tarjeta (deshabilitado temporalmente, ver Notas de producto)

## Configuración

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env.local` y agrega tus llaves:

   ```bash
   cp .env.example .env.local
   ```

   - `GEMINI_API_KEY`: obtén una en [Google AI Studio](https://aistudio.google.com/app/apikey). Sin esta llave, la app funciona en modo demostración con un análisis simplificado local.
   - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`: solo necesarios si reactivas el pago con tarjeta (ver `PAGO_TARJETA_HABILITADO` en `src/app/api/checkout/route.ts`).
   - `DATABASE_URL`: cadena de conexión Postgres. En Render se inyecta automáticamente vía `render.yaml`. En local, usa cualquier Postgres (ej. `postgres://usuario:pass@localhost:5432/cvmatch`).
   - `ADMIN_PASSWORD`: contraseña para entrar al panel en `/admin`.
   - `SESSION_SECRET`: cadena secreta larga y aleatoria usada para firmar las sesiones de las cuentas de cliente (`/cuenta`). Si no se define, usa `ADMIN_PASSWORD` como respaldo — en producción defínela por separado.

3. Corre el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Estructura

- `src/app/page.tsx` — landing page (Header, Hero, Cómo funciona, Precios, Donaciones, Casos de éxito)
- `src/app/analisis` — wizard de 3 pasos (perfil → vacante → resultados)
- `src/app/cuenta` — registro, login y panel del cliente (créditos y CVs guardados)
- `src/app/admin` — panel protegido por contraseña: visitas, compras, solicitudes de transferencia (con botón para aprobarlas) y donantes
- `src/app/api/match` — endpoint que llama a Gemini para el análisis de match
- `src/app/api/enhance` — mejora con IA de la experiencia y el resumen profesional
- `src/app/api/transferencia` — registra una solicitud de pago por transferencia
- `src/app/api/cuenta/*` — registro, login, logout, perfil y descarga de la cuenta de cliente
- `src/app/api/admin/aprobar-transferencia` — marca una transferencia como confirmada y acredita las descargas a la cuenta con ese correo
- `src/lib/gemini.ts` — prompts de sistema y lógica de análisis ATS
- `src/lib/pdf.ts` — generación del CV en PDF
- `src/lib/db.ts` — acceso a Postgres (visitas, compras, usuarios, CVs, donantes)
- `src/lib/config.ts` — precio del paquete, número de descargas, correo de comprobantes y datos bancarios

## Flujo de pago por transferencia

1. Para descargar su CV, el cliente necesita una cuenta (`/cuenta/registro`).
2. Con sesión iniciada, al hacer clic en "Pagar por transferencia" ve los datos bancarios; al confirmar que ya transfirió, el sistema genera un **código de seguimiento único** (ej. `MCV-A1B2C3`) ligado a su cuenta.
3. El cliente manda su comprobante junto con ese código por WhatsApp (botón que abre `wa.me` con el mensaje precargado).
4. En `/admin`, la tabla "Solicitudes de transferencia por confirmar" muestra el código y el cliente (nombre y correo). El admin compara el código contra lo que le llegó por WhatsApp.
5. Al hacer clic en **Aprobar**, se acreditan automáticamente las descargas del paquete a esa cuenta.
6. El cliente ve el cambio de estado ("Pago aprobado") en `/cuenta` la próxima vez que entra — no hay notificación push automática, solo por WhatsApp de forma manual.

## Notas de producto

- El diagnóstico y reporte de match son 100% gratuitos.
- El pago con tarjeta (Stripe) está deshabilitado temporalmente en la UI y en el backend (`PAGO_TARJETA_HABILITADO = false` en `src/app/api/checkout/route.ts`). El código sigue completo para reactivarlo cuando se desee.
- El panel `/admin` no tiene límite de intentos de contraseña (rate limiting) — para un uso más expuesto, agrega esa protección.
- Las contraseñas de clientes se guardan con `scrypt` (hash + salt), sin dependencias externas.
