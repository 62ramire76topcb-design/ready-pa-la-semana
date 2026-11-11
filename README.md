# Ready pa' la semana — Meal Prep (Charlotte NC)

App de meal prep con menu controlado 100% desde admin: platos, precios, stock, imagenes, disponibilidad del dia y pedidos especiales.

## Enlaces

| | URL |
|--|--|
| Cliente | https://ready-pa-la-semana.vercel.app |
| Admin | https://ready-pa-la-semana.vercel.app/admin |
| Seguimiento | https://ready-pa-la-semana.vercel.app/seguimiento |

## Modelo de negocio

- Sin planes fijos ni suscripcion
- Menu del dia: la dueña publica lo que tiene disponible (stock bajo)
- Precio + descripcion de ingredientes por plato
- Pedidos especiales (platos a pedido)
- Entrega solo en Charlotte, NC
- Compra unica con Stripe

## Admin puede

- Agregar / editar / eliminar platos
- Subir imagen o pegar URL
- Controlar precio y stock
- Publicar u ocultar platos del dia
- Ver pedidos (menu + especiales) y cambiar estados

## Firebase

Proyecto: `ready-pa-la-semana`

Colecciones:
- `meals` — menu
- `ready_orders` — pedidos

Reglas sugeridas (pruebas):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /meals/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /ready_orders/{id} {
      allow create: if true;
      allow read, update: if true; // endurecer en produccion
    }
  }
}
```

Storage (imagenes de platos) — reglas de prueba:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /meals/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Variables Vercel

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (opcional pero recomendado)
- `NEXT_PUBLIC_BASE_URL` = https://ready-pa-la-semana.vercel.app

## Stack

Next.js 15 · Firebase (Auth, Firestore, Storage) · Stripe · Tailwind
