import Area from '@components/common/Area.js';
import { Toaster } from '@components/common/ui/Sonner.js';
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Twitter
} from 'lucide-react';
import React from 'react';

interface FooterProps {
  copyRight?: string;
  setting?: {
    storeName?: string | null;
    storeEmail?: string | null;
    storePhoneNumber?: string | null;
    storeAddress?: string | null;
    storeCity?: string | null;
    storeCountry?: string | null;
    storeInstagram?: string | null;
    storeFacebook?: string | null;
    storeWhatsapp?: string | null;
    storeTiktok?: string | null;
    storeTwitter?: string | null;
    helpLinkShipping?: string | null;
    helpLinkReturns?: string | null;
    helpLinkFaq?: string | null;
    helpLinkContact?: string | null;
  };
}

const SHOP_LINKS = [
  { label: 'Esmalte en gel', href: '/esmalte' },
  { label: 'Uñas', href: '/u-as' },
  { label: 'Todos los productos', href: '/esmalte' }
];

// HELP_LINKS now reads from settings — see buildHelpLinks() inside Footer.

const LEGAL_LINKS = [
  { label: 'Términos y condiciones', href: '#' },
  { label: 'Política de privacidad', href: '#' },
  { label: 'Política de cookies', href: '#' }
];

function PaymentBadge({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      className="h-8 w-12 bg-white rounded-md flex items-center justify-center shadow-sm ring-1 ring-gray-200"
      aria-label={label}
      title={label}
    >
      {children}
    </div>
  );
}

export function Footer({ copyRight, setting }: FooterProps) {
  const year = new Date().getFullYear();
  const brandName = setting?.storeName || 'Anroy';
  const fallbackCopy = `© ${year} ${brandName}. Todos los derechos reservados.`;
  const finalCopy =
    !copyRight || /evershop/i.test(copyRight) ? fallbackCopy : copyRight;

  // Build a human-readable location string from the configured pieces.
  const locationLines = [
    setting?.storeAddress,
    [setting?.storeCity, setting?.storeCountry].filter(Boolean).join(', ')
  ]
    .map((l) => (l ? l.trim() : ''))
    .filter(Boolean);
  const hasLocation = locationLines.length > 0;
  const email = setting?.storeEmail;
  const phone = setting?.storePhoneNumber;
  const hasAnyContact = hasLocation || email || phone;

  return (
    <footer className="footer mt-16 bg-gray-900 text-gray-300">
      <Area id="footerTop" className="footer__top" />

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14">
          {/* Brand column */}
          <div className="space-y-5">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {brandName}
            </div>
            <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
              Belleza considerada para uñas. Productos curados, envío rápido y atención cercana en
              todo República Dominicana.
            </p>
            {(() => {
              const socials = [
                { url: setting?.storeInstagram, Icon: Instagram, label: 'Instagram' },
                { url: setting?.storeFacebook, Icon: Facebook, label: 'Facebook' },
                { url: setting?.storeWhatsapp, Icon: MessageCircle, label: 'WhatsApp' },
                { url: setting?.storeTiktok, Icon: Music2, label: 'TikTok' },
                { url: setting?.storeTwitter, Icon: Twitter, label: 'X / Twitter' }
              ].filter((s) => s.url);
              if (socials.length === 0) return null;
              return (
                <div className="flex items-center gap-2">
                  {socials.map(({ url, Icon, label }) => (
                    <a
                      key={label}
                      href={url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      title={label}
                      className="w-9 h-9 rounded-full bg-white/5 hover:bg-rose-600 hover:text-white text-gray-300 flex items-center justify-center transition-colors"
                    >
                      <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Tienda */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Tienda</h3>
            <ul className="space-y-2.5">
              {SHOP_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda — solo aparece si hay al menos un link configurado */}
          {(() => {
            const helpLinks = [
              { label: 'Envíos y entregas', href: setting?.helpLinkShipping },
              { label: 'Devoluciones', href: setting?.helpLinkReturns },
              { label: 'Preguntas frecuentes', href: setting?.helpLinkFaq },
              { label: 'Contáctanos', href: setting?.helpLinkContact }
            ].filter((l) => l.href && l.href.trim());
            if (helpLinks.length === 0) return null;
            return (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Ayuda</h3>
                <ul className="space-y-2.5">
                  {helpLinks.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href!}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Contacto — solo aparece si hay al menos un dato configurado */}
          {hasAnyContact && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Contacto</h3>
              <ul className="space-y-3">
                {hasLocation && (
                  <li className="flex items-start gap-2.5 text-sm text-gray-400">
                    <MapPin className="w-4 h-4 mt-0.5 text-rose-400 shrink-0" strokeWidth={1.75} />
                    <span>
                      {locationLines.map((line, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <br />}
                          {line}
                        </React.Fragment>
                      ))}
                    </span>
                  </li>
                )}
                {email && (
                  <li className="flex items-center gap-2.5 text-sm text-gray-400">
                    <Mail className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={1.75} />
                    <a
                      href={`mailto:${email}`}
                      className="hover:text-white transition-colors"
                    >
                      {email}
                    </a>
                  </li>
                )}
                {phone && (
                  <li className="flex items-center gap-2.5 text-sm text-gray-400">
                    <Phone className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={1.75} />
                    <a
                      href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                      className="hover:text-white transition-colors"
                    >
                      {phone}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Payment row */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs uppercase tracking-widest text-gray-500 mr-2">
              Pagos seguros
            </span>
            <PaymentBadge label="Visa">
              <svg viewBox="0 0 38 24" className="h-5">
                <path
                  fill="#142688"
                  d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0 2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4 1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-.7.6-1.4.6-1.4 0-2.5.1-3.4-.2-.1.2-.1.2-.2.1zm-3.5.3c.1-.7.1-.7.2-1 .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2M5 8.2c0-.1.2-.2.3-.2h3.4c.5 0 .9.3 1 .8l.9 4.4c0 .1 0 .1.1.2 0-.1.1-.1.1-.1l2.1-5.1c-.1-.1 0-.2.1-.2h2.1c0 .1 0 .1-.1.2l-3.1 7.3c-.1.2-.1.3-.2.4-.1.1-.3 0-.5 0H9.7c-.1 0-.2 0-.2-.2L7.9 9.5c-.2-.2-.5-.5-.9-.6-.6-.3-1.7-.5-1.9-.5L5 8.2z"
                />
              </svg>
            </PaymentBadge>
            <PaymentBadge label="Mastercard">
              <svg viewBox="0 0 38 24" className="h-5">
                <circle cx="15" cy="12" r="7" fill="#EB001B" />
                <circle cx="23" cy="12" r="7" fill="#F79E1B" />
                <path
                  fill="#FF5F00"
                  d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z"
                />
              </svg>
            </PaymentBadge>
            <PaymentBadge label="PayPal">
              <svg viewBox="0 0 38 24" className="h-5">
                <path
                  fill="#003087"
                  d="M23.9 8.3c.2-1 0-1.7-.6-2.3-.6-.7-1.7-1-3.1-1h-4.1c-.3 0-.5.2-.6.5L14 15.6c0 .2.1.4.3.4H17l.4-3.4 1.8-2.2 4.7-2.1z"
                />
                <path
                  fill="#3086C8"
                  d="M23.9 8.3l-.2.2c-.5 2.8-2.2 3.8-4.6 3.8H18c-.3 0-.5.2-.6.5l-.6 3.9-.2 1c0 .2.1.4.3.4H19c.3 0 .5-.2.5-.4v-.1l.4-2.4v-.1c0-.2.3-.4.5-.4h.3c2.1 0 3.7-.8 4.1-3.2.2-1 .1-1.8-.4-2.4-.1-.5-.3-.7-.5-.8z"
                />
                <path
                  fill="#012169"
                  d="M23.3 8.1c-.1-.1-.2-.1-.3-.1-.1 0-.2 0-.3-.1-.3-.1-.7-.1-1.1-.1h-3c-.1 0-.2 0-.2.1-.2.1-.3.2-.3.4l-.7 4.4v.1c0-.3.3-.5.6-.5h1.3c2.5 0 4.1-1 4.6-3.8v-.2c-.1-.1-.3-.2-.5-.2h-.1z"
                />
              </svg>
            </PaymentBadge>
            <PaymentBadge label="Transferencia">
              <span className="text-[10px] font-bold text-gray-700 tracking-wide">BANCO</span>
            </PaymentBadge>
            <PaymentBadge label="Efectivo contra entrega">
              <span className="text-[10px] font-bold text-emerald-700">CASH</span>
            </PaymentBadge>
          </div>

          <div className="text-xs text-gray-500">
            <span className="text-rose-400">●</span> Compras 100% seguras
          </div>
        </div>
      </div>

      {/* Bottom strip — copyright */}
      <div className="border-t border-white/5 bg-black/30">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500">{finalCopy}</div>
          <div className="flex items-center gap-4 text-xs">
            {LEGAL_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Areas reservadas para extensiones, ocultas si vacías */}
      <Area id="footerBottom" className="footer__bottom empty:hidden" />
      <div className="hidden">
        <Area id="footerMiddleLeft" />
        <Area id="footerMiddleCenter" />
        <Area id="footerMiddleRight" />
      </div>

      <Toaster />
    </footer>
  );
}
