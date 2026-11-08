/** Solo datos ficticios. Ningún elemento procede de repositorios financieros. */
export const goals = [
  { id: 'home', title: 'Comprar una casa', icon: 'home-outline', saved: '$18,000', target: '$60,000', percent: 30, tone: 'blue' },
  { id: 'car', title: 'Comprar un auto', icon: 'car-sport-outline', saved: '$3,500', target: '$25,000', percent: 14, tone: 'coral' },
  { id: 'travel', title: 'Vacaciones', icon: 'sunny-outline', saved: '$1,200', target: '$4,000', percent: 30, tone: 'mint' },
  { id: 'emergency', title: 'Fondo de emergencia', icon: 'shield-checkmark-outline', saved: '$2,800', target: '$10,000', percent: 28, tone: 'violet' },
] as const;
export const lessons = [
  { title: 'Conceptos básicos', description: 'Aprende de dinero sin complicaciones.', icon: 'bulb-outline', tone: 'mint' },
  { title: 'Manejo de deudas', description: 'Estrategias simples para pagar más rápido.', icon: 'card-outline', tone: 'violet' },
  { title: 'Ahorro e inversión', description: 'Pequeños pasos, grandes resultados.', icon: 'trending-up-outline', tone: 'mint' },
  { title: 'Compras inteligentes', description: 'Antes de decidir, analiza y compara.', icon: 'cart-outline', tone: 'blue' },
  { title: 'Planificación a largo plazo', description: 'Vivienda, retiro y más.', icon: 'flag-outline', tone: 'violet' },
] as const;
export const expenses = [
  { name: 'Vivienda', percent: 38, amount: '$740.00', color: '#0079B5' },
  { name: 'Comida', percent: 18, amount: '$352.40', color: '#DB384F' },
  { name: 'Transporte', percent: 12, amount: '$234.00', color: '#CC9B12' },
  { name: 'Servicios', percent: 10, amount: '$195.00', color: '#159DAB' },
  { name: 'Deudas', percent: 8, amount: '$156.00', color: '#8D54CA' },
  { name: 'Otros', percent: 14, amount: '$277.28', color: '#008963' },
];
export const bills = [
  { title: 'LUMA', description: 'Electricidad', date: '5 nov 2026', amount: '$125.00', icon: 'flash', tone: 'mint' },
  { title: 'Claro', description: 'Internet', date: '8 nov 2026', amount: '$75.00', icon: 'wifi', tone: 'coral' },
  { title: 'Popular', description: 'Tarjeta de crédito', date: '12 nov 2026', amount: '$210.00', icon: 'card-outline', tone: 'blue' },
] as const;
