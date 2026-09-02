import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
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
              name: "Paquete de 10 descargas de CV optimizado ATS",
              description: "10 adaptaciones de CV en PDF listas para pasar filtros ATS.",
            },
            unit_amount: 9900,
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
