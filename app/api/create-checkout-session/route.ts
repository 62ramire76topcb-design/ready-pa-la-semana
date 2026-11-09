import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, planLabel, total, orderId, successUrl, cancelUrl } = body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe no est\u00e1 configurado. Agrega STRIPE_SECRET_KEY en las variables de entorno." },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Ready pa' la semana - ${planLabel}`,
              description: `Plan de comidas preparadas - ${name || "Cliente"}`,
            },
            unit_amount: Math.round(Number(total) * 100),
          },
          quantity: 1,
        },
      ],
      success_url:
        successUrl ||
        `${process.env.NEXT_PUBLIC_BASE_URL || "https://ready-pa-la-semana.vercel.app"}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url:
        cancelUrl ||
        `${process.env.NEXT_PUBLIC_BASE_URL || "https://ready-pa-la-semana.vercel.app"}/`,
      metadata: {
        orderId: orderId || "",
        customerName: (name || "").substring(0, 200),
        email: (email || "").substring(0, 100),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: unknown) {
    console.error("Stripe error:", error);
    const message = error instanceof Error ? error.message : "Error creando sesi\u00f3n de pago";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}