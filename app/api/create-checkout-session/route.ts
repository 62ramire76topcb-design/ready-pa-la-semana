import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        {
          error:
            "Stripe no esta configurado. Agrega STRIPE_SECRET_KEY en las variables de entorno de Vercel.",
        },
        { status: 500 }
      );
    }

    const stripe = new Stripe(secret);
    const body = await req.json();
    const { email, name, planLabel, total, orderId, orderNumber, successUrl, cancelUrl } = body;

    const base = process.env.NEXT_PUBLIC_BASE_URL || "https://ready-pa-la-semana.vercel.app";

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
              description: `Orden ${orderNumber || ""} - ${name || "Cliente"}`,
            },
            unit_amount: Math.round(Number(total) * 100),
          },
          quantity: 1,
        },
      ],
      success_url:
        successUrl ||
        `${base}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId || ""}`,
      cancel_url: cancelUrl || `${base}/`,
      metadata: {
        orderId: orderId || "",
        orderNumber: orderNumber || "",
        customerName: (name || "").substring(0, 200),
        email: (email || "").substring(0, 100),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: unknown) {
    console.error("Stripe error:", error);
    const message = error instanceof Error ? error.message : "Error creando sesion de pago";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
