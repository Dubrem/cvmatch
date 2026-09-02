import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { registrarCompra } from "@/lib/db";

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe no está configurado." }, { status: 501 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta la firma de Stripe." }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = new Stripe(secretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Firma de webhook inválida:", error);
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await registrarCompra({
        sessionId: session.id,
        email: session.customer_details?.email ?? session.customer_email ?? null,
        amountTotal: session.amount_total,
        currency: session.currency,
      });
    } catch (error) {
      console.error("Error al registrar la compra:", error);
    }
  }

  return NextResponse.json({ received: true });
}
