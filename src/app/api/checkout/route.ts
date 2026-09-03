import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { DESCARGAS_PAQUETE, PRECIO_PAQUETE_CENTAVOS } from "@/lib/config";

const PAGO_TARJETA_HABILITADO = false;

export async function POST(req: NextRequest) {
  if (!PAGO_TARJETA_HABILITADO) {
    return NextResponse.json(
      { error: "El pago con tarjeta está deshabilitado temporalmente. Usa transferencia bancaria." },
      { status: 501 }
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      {
        error:
          "Stripe no está configurado. Define STRIPE_SECRET_KEY en las variables de entorno del servidor para habilitar cobros reales.",
      },
      { status: 501 }
    );
  }

  try {
    const { origin } = await req.json();
    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: `Paquete de ${DESCARGAS_PAQUETE} descargas de CV optimizado ATS`,
              description: `${DESCARGAS_PAQUETE} adaptaciones de CV en PDF listas para pasar filtros ATS.`,
            },
            unit_amount: PRECIO_PAQUETE_CENTAVOS,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/analisis?pago=exitoso`,
      cancel_url: `${origin}/#precios`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creando sesión de checkout:", error);
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 500 });
  }
}
