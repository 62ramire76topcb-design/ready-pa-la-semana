# Ready pa' la semana

Servicio de delivery de comidas preparadas — onboarding multi-step + panel admin + seguimiento.

## Enlaces

| Sitio | URL |
|-------|-----|
| Cliente | https://ready-pa-la-semana.vercel.app |
| Seguimiento | https://ready-pa-la-semana.vercel.app/seguimiento |
| Admin | https://ready-pa-la-semana.vercel.app/admin |
| Repo | https://github.com/62ramire76topcb-design/ready-pa-la-semana |

## Variables de entorno (Vercel)

```
STRIPE_SECRET_KEY=sk_test_... o sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_BASE_URL=https://ready-pa-la-semana.vercel.app
```

Firebase usa el proyecto `agromaxgt-app` (claves publicas en `lib/firebase.ts`).

## Configurar Webhook de Stripe

1. Entra a [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Clic en **Add endpoint**
3. Endpoint URL:
   ```
   https://ready-pa-la-semana.vercel.app/api/webhooks/stripe
   ```
4. Eventos a escuchar:
   - `checkout.session.completed`
   - `checkout.session.expired` (opcional)
5. Copia el **Signing secret** (`whsec_...`)
6. En Vercel → Settings → Environment Variables agrega:
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: el `whsec_...`
7. Redeploy el proyecto

Cuando un cliente pague, el pedido pasa automaticamente de `pending` → `paid`.

## Stack

- Next.js 15 + TypeScript + Tailwind
- Firebase (Auth + Firestore)
- Stripe Checkout + Webhooks
- Framer Motion

## Estructura

```
app/
  page.tsx                         # Wizard 7 pasos
  admin/page.tsx                   # Panel admin con filtros
  success/page.tsx                 # Post-pago + PDF
  seguimiento/page.tsx             # Tracking de orden
  api/
    create-checkout-session/       # Crea sesion Stripe
    webhooks/stripe/               # Webhook → marca paid
lib/
  firebase.ts, orders.ts, meals.ts, types.ts
components/wizard/
```
