# Ready pa' la semana \u{1F37D}\uFE0F

Servicio de delivery de comidas preparadas \u2014 flujo de onboarding multi-step + panel admin.

## Caracter\u00edsticas

- **Wizard de 7 pasos**: d\u00edas, preferencia, personas, selecci\u00f3n de comidas, direcci\u00f3n, datos de contacto, pago
- **Selecci\u00f3n de comidas** filtrada por preferencia diet\u00e9tica
- **Stripe Checkout** real (requiere `STRIPE_SECRET_KEY`)
- **Firebase Firestore** para guardar pedidos
- **Panel Admin** en `/admin` (login con Firebase Auth)
- **Colores personalizados** (teal/brand)
- **Arquitectura modular** (components, lib, types)
- Persistencia en localStorage

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + Framer Motion
- Firebase (Auth + Firestore)
- Stripe

## Variables de entorno (Vercel)

```
STRIPE_SECRET_KEY=sk_live_...   # o sk_test_...
NEXT_PUBLIC_BASE_URL=https://ready-pa-la-semana.vercel.app
```

Firebase usa por defecto el proyecto `agromaxgt-app` (las claves p\u00fablicas est\u00e1n en `lib/firebase.ts`).

## Enlaces

| Sitio | URL |
|-------|-----|
| Cliente | https://ready-pa-la-semana.vercel.app |
| Admin | https://ready-pa-la-semana.vercel.app/admin |
| Repo | https://github.com/62ramire76topcb-design/ready-pa-la-semana |

## Estructura

```
app/
  page.tsx              # Wizard principal
  admin/page.tsx        # Panel de pedidos
  success/page.tsx      # P\u00e1gina post-pago
  api/create-checkout-session/route.ts
components/wizard/      # Componentes del flujo
lib/
  firebase.ts
  orders.ts
  meals.ts
  types.ts
```

## Admin

1. Ve a `/admin`
2. Inicia sesi\u00f3n con una cuenta de Firebase Auth del proyecto `agromaxgt-app`
3. Ver\u00e1s todos los pedidos, direcciones y podr\u00e1s cambiar el estado

---

Hecho con \u2764\uFE0F de forma modular.