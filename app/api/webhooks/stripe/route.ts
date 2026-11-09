import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY no configurada" }, { status: 500 });
  }

  const stripe = new Stripe(secret);
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Fallback sin verificacion (solo para pruebas locales)
      event = JSON.parse(body) as Stripe.Event;
      console.warn("Webhook sin STRIPE_WEBHOOK_SECRET: firma no verificada");
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Firma invalida";
    console.error("Webhook signature error:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      const orderNumber = session.metadata?.orderNumber;

      console.log("Checkout completed:", {
        sessionId: session.id,
        orderId,
        orderNumber,
        paymentStatus: session.payment_status,
      });

      if (orderId && session.payment_status === "paid") {
        const ref = doc(db, "ready_orders", orderId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const prev = snap.data();
          const history = Array.isArray(prev?.statusHistory) ? prev.statusHistory : [];

          // Solo actualizar si aun esta pending
          if (prev?.status === "pending" || !prev?.status) {
            await updateDoc(ref, {
              status: "paid",
              stripeSessionId: session.id,
              statusHistory: [
                ...history,
                { status: "paid", at: Date.now() },
              ],
            });
            console.log(`Orden ${orderNumber || orderId} marcada como paid`);
          }
        } else {
          console.warn(`Orden no encontrada en Firestore: ${orderId}`);
        }
      }
    }

    // Otros eventos utiles (opcional)
    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const ref = doc(db, "ready_orders", orderId);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data()?.status === "pending") {
          const history = Array.isArray(snap.data()?.statusHistory)
            ? snap.data()!.statusHistory
            : [];
          await updateDoc(ref, {
            status: "cancelled",
            statusHistory: [...history, { status: "cancelled", at: Date.now() }],
          });
          console.log(`Orden ${orderId} cancelada por sesion expirada`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Webhook handler error:", err);
    const message = err instanceof Error ? err.message : "Error procesando webhook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
