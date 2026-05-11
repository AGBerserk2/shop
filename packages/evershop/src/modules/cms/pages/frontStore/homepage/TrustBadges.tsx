import React from 'react';
import { Truck, ShieldCheck, RotateCcw, CreditCard, Headphones } from 'lucide-react';

const badges = [
  {
    Icon: Truck,
    title: 'Envío rápido',
    text: 'Entrega en 24-72h a todo el país'
  },
  {
    Icon: RotateCcw,
    title: 'Devoluciones gratis',
    text: '30 días para cambiar de opinión'
  },
  {
    Icon: ShieldCheck,
    title: 'Pago 100% seguro',
    text: 'Tus datos siempre encriptados'
  },
  {
    Icon: CreditCard,
    title: 'Múltiples métodos',
    text: 'Tarjeta, transferencia o efectivo'
  },
  {
    Icon: Headphones,
    title: 'Soporte 7 días',
    text: 'Estamos para ayudarte cuando lo necesites'
  }
];

export default function TrustBadges() {
  return (
    <section className="w-full bg-white border-t">
      <div className="max-w-screen-2xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {badges.map(({ Icon, title, text }, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-50 to-amber-50 ring-1 ring-rose-100">
                <Icon className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500 leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 70
};
