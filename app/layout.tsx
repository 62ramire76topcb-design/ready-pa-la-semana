import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ready pa' la semana | Comidas preparadas",
  description: "Comidas deliciosas y nutritivas listas para calentar. Elige tu plan semanal en minutos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}