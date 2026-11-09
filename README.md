# Ready pa' la semana 🍽️

Flujo de selección de plan de comidas estilo Factor75.

Un onboarding multi-step moderno y limpio para un servicio de delivery de comidas preparadas.

## Características

- **Wizard de 4 pasos** con animaciones suaves (Framer Motion)
- Selección de días por semana
- Preferencias dietéticas (Alto en proteína, Keto, Calorie Smart, etc.)
- Captura de código postal
- Resumen del plan + CTA de pago
- Diseño responsive y mobile-first
- Progress bar animada
- Banner promocional

## Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animaciones)
- **clsx** (clases condicionales)

## Cómo correrlo localmente

```bash
# Clonar el repo
git clone https://github.com/62ramire76topcb-design/ready-pa-la-semana.git
cd ready-pa-la-semana

# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del proyecto

```
app/
  ├─ layout.tsx      # Layout principal + metadata
  ├─ page.tsx        # Wizard completo (todo el flujo)
  └─ globals.css     # Estilos globales + Tailwind
```

## Próximos pasos posibles

- [ ] Integrar Stripe para el pago real
- [ ] Guardar el progreso en localStorage / backend
- [ ] Validación real de códigos postales
- [ ] Panel de administración de menús
- [ ] Sistema de códigos promocionales
- [ ] Deploy en Vercel

---

Hecho con ❤️ para que puedas tener tu propio Factor-like.