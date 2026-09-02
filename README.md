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
- `src/lib/gemini.ts` — prompt de sistema y lógica de análisis ATS
- `src/lib/pdf.ts` — generación del CV en PDF

## Notas de producto

- El diagnóstico y reporte de match son 100% gratuitos.
- Las descargas de CV están limitadas a créditos (10 por paquete de $99 MXN). En esta versión los créditos se gestionan en `localStorage` del navegador como demostración; para producción se recomienda persistirlos por usuario autenticado en una base de datos, y confirmar el pago vía webhook de Stripe en lugar del redirect de éxito.
- El banner de "Beca Comunitaria" dirige a un correo de contacto (`becas@matchcv.mx`) — reemplázalo por el flujo real de tu organización.
