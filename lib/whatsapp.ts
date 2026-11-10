export const WHATSAPP_NUMBER = "190459102849"; // +1 904-591-0249

export function buildWhatsAppUrl(message: string): string {
  const text = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export function buildLeadMessage(opts: {
  orderNumber: string;
  name: string;
  planLabel: string;
  total: number;
}): string {
  return (
    `Hola! Me interesa Ready pa' la semana.\n` +
    `Numero de seguimiento: ${opts.orderNumber}\n` +
    `Nombre: ${opts.name}\n` +
    `Plan: ${opts.planLabel}\n` +
    `Total estimado: $${opts.total.toFixed(2)}\n` +
    `Quiero cerrar mi pedido por WhatsApp.`
  );
}
