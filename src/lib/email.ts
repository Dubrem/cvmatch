import nodemailer from "nodemailer";
import { DESCARGAS_PAQUETE, SITE_URL } from "./config";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function enviarNotificacionAprobacion(
  correo: string,
  nombre: string
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(
      "GMAIL_USER/GMAIL_APP_PASSWORD no configurados: no se envió el correo de confirmación."
    );
    return false;
  }

  const cuentaUrl = `${SITE_URL}/cuenta`;

  await transporter.sendMail({
    from: `"MatchCV" <${process.env.GMAIL_USER}>`,
    to: correo,
    subject: "¡Tu pago fue confirmado! Ya puedes descargar tu CV",
    text: `Hola ${nombre},\n\nConfirmamos tu pago y agregamos ${DESCARGAS_PAQUETE} descargas a tu cuenta de MatchCV.\n\nInicia sesión aquí para descargar tu CV optimizado: ${cuentaUrl}\n\n— Equipo MatchCV`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#0f172a;">¡Tu pago fue confirmado!</h2>
        <p>Hola ${nombre},</p>
        <p>Confirmamos tu pago y agregamos <strong>${DESCARGAS_PAQUETE} descargas</strong> a tu cuenta de MatchCV.</p>
        <p>
          <a href="${cuentaUrl}" style="display:inline-block;background:#0284c7;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Ir a mi cuenta
          </a>
        </p>
        <p style="color:#64748b;font-size:13px;">— Equipo MatchCV</p>
      </div>
    `,
  });

  return true;
}
