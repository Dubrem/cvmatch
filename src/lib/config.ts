export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cvmatch-1b6e.onrender.com";
export const PRECIO_PAQUETE_CENTAVOS = 4900;
export const DESCARGAS_PAQUETE = 3;
export const CORREO_COMPROBANTES = "primermatchcv@gmail.com";
export const WHATSAPP_COMPROBANTES = "4421052174";
export const DATOS_BANCARIOS = {
  banco: "HSBC",
  clabe: "021680066044876824",
  titular: "Aldo Serrat Vega",
};

export function construirLinkWhatsApp(codigo: string): string {
  const mensaje = `Hola, aquí está mi comprobante de transferencia para MatchCV. Mi código de seguimiento es: ${codigo}`;
  return `https://wa.me/52${WHATSAPP_COMPROBANTES}?text=${encodeURIComponent(mensaje)}`;
}
