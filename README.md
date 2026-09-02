# MatchCV

Plataforma para recién egresados y estudiantes universitarios: diagnóstico gratuito de compatibilidad (match) contra una vacante objetivo, análisis estilo ATS con IA (Gemini), y generación de CV optimizado en PDF.

## Stack

- **Next.js 16** (App Router, TypeScript) + Tailwind CSS v4
- **Google Gemini API** (`@google/generative-ai`) para el análisis de match ATS
- **jsPDF** para generar el CV en PDF de una columna, limpio para ATS
- **Stripe** para el checkout del paquete de 10 descargas ($99 MXN)

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
   - `STRIPE_SECRET_KEY`: obtén una en el [dashboard de Stripe](https://dashboard.stripe.com/apikeys). Sin esta llave, el botón de compra mostrará un aviso indicando que la pasarela no está configurada.
   - `STRIPE_WEBHOOK_SECRET`: crea un webhook en el [dashboard de Stripe](https://dashboard.stripe.com/webhooks) apuntando a `<tu-url>/api/stripe/webhook`, escuchando el evento `checkout.session.completed`, y copia el "Signing secret".
   - `DATABASE_URL`: cadena de conexión Postgres. En Render se inyecta automáticamente si usas `render.yaml`. En local, usa cualquier Postgres (ej. `postgres://usuario:pass@localhost:5432/cvmatch`).
   - `ADMIN_PASSWORD`: contraseña para entrar al panel en `/admin`.

3. Corre el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## Estructura

- `src/app/page.tsx` — landing page (Header, Hero, Cómo funciona, Precios, Donaciones, Casos de éxito)
- `src/app/analisis` — wizard de 3 pasos (perfil → vacante → resultados)
- `src/app/api/match` — endpoint que llama a Gemini para el análisis de match
- `src/app/api/checkout` — endpoint que crea una sesión de Stripe Checkout
- `src/app/api/stripe/webhook` — recibe la confirmación de pago de Stripe y la guarda en la base de datos
- `src/app/api/track` — registra una visita a la página
- `src/app/admin` — panel protegido por contraseña con visitas totales, gráfica de los últimos 7 días y lista de compras
- `src/lib/gemini.ts` — prompt de sistema y lógica de análisis ATS
- `src/lib/pdf.ts` — generación del CV en PDF
- `src/lib/db.ts` — acceso a Postgres (visitas y compras)

## Notas de producto

- El diagnóstico y reporte de match son 100% gratuitos.
- Las descargas de CV siguen limitadas a créditos gestionados en `localStorage` del navegador (no ligados a la compra real todavía) — la tabla `purchases` ya registra quién pagó, pero falta conectar esos créditos a una cuenta de usuario autenticada para producción.
- El banner de "Beca Comunitaria" dirige a un correo de contacto (`becas@matchcv.mx`) — reemplázalo por el flujo real de tu organización.
- El panel `/admin` no tiene límite de intentos de contraseña (rate limiting) — para un uso más expuesto, agrega esa protección.
