import { Image } from '@components/common/Image.js';
import { ProductNoThumbnail } from '@components/common/ProductNoThumbnail.js';
import { Form } from '@components/common/form/Form.js';
import { CheckboxField } from '@components/common/form/CheckboxField.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@components/common/ui/Dialog.js';
import {
  Order,
  ExtendedCustomerAddress,
  useCustomer,
  useCustomerDispatch
} from '@components/frontStore/customer/CustomerContext.jsx';
import CustomerAddressForm from '@components/frontStore/customer/address/addressForm/Index.js';
import { ArrowRight, Sparkles } from 'lucide-react';
import React from 'react';
import { toast } from 'react-toastify';
import './MyAccount.scss';

const AVATAR_TONES = [
  'rgb(255 218 215)',
  'rgb(255 232 191)',
  'rgb(216 232 215)',
  'rgb(212 226 240)',
  'rgb(232 220 248)',
  'rgb(255 224 210)',
  'rgb(245 218 234)',
  'rgb(208 232 230)'
];

function pickTone(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

function initialsOf(name?: string | null, email?: string | null): string {
  const source = (name && name.trim()) || (email && email.split('@')[0]) || '';
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function statusTone(code: string): 'shipped' | 'delivered' | 'processing' | 'cancelled' {
  const c = (code || '').toLowerCase();
  if (c.includes('cancel')) return 'cancelled';
  if (c.includes('deliver') || c.includes('complete')) return 'delivered';
  if (c.includes('ship') || c.includes('dispatch')) return 'shipped';
  return 'processing';
}

function formatMemberSince(value?: string): string {
  if (!value) return '';
  try {
    const d = new Date(value);
    return d.toLocaleDateString('es-DO', {
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buen día';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function paddedIssue(index: number) {
  return String(index + 1).padStart(3, '0');
}

const OrderCard: React.FC<{ order: Order; issueNumber: number }> = ({
  order,
  issueNumber
}) => {
  const tone = statusTone(order.status?.code || order.status?.name || '');
  return (
    <article className="anroy-account__order">
      <div className="anroy-account__order-meta">
        <span className="anroy-account__order-issue">
          Pedido · No. {paddedIssue(issueNumber)}
        </span>
        <span className="anroy-account__order-number">
          #{order.orderNumber}
        </span>
        <span className="anroy-account__order-date">
          {order.createdAt?.text || ''}
        </span>
        <span
          className="anroy-account__order-status"
          data-tone={tone}
          title={order.status?.name}
        >
          {order.status?.name || 'Pendiente'}
        </span>
      </div>

      <div className="anroy-account__order-items">
        {order.items.slice(0, 3).map((item) => (
          <div className="anroy-account__order-item" key={item.uuid}>
            <div className="anroy-account__order-thumb">
              {item.thumbnail ? (
                <Image
                  width={56}
                  height={56}
                  src={item.thumbnail}
                  alt={item.productName}
                />
              ) : (
                <ProductNoThumbnail width={32} height={32} />
              )}
            </div>
            <div className="anroy-account__order-item-info">
              <div className="anroy-account__order-item-name">
                {item.productName}
              </div>
              <div className="anroy-account__order-item-meta">
                <span>×{item.qty}</span>
                <span>·</span>
                <span>{item.productPrice?.text}</span>
              </div>
            </div>
          </div>
        ))}
        {order.items.length > 3 && (
          <div className="anroy-account__order-item-meta" style={{ paddingLeft: '4.4rem' }}>
            <span>+ {order.items.length - 3} más</span>
          </div>
        )}
      </div>

      <div className="anroy-account__order-totals">
        <span className="label">Total</span>
        <span className="value">{order.grandTotal?.text}</span>
        <span className="qty">{order.totalQty} pieza{order.totalQty === 1 ? '' : 's'}</span>
      </div>
    </article>
  );
};

const AddressCard: React.FC<{
  address: ExtendedCustomerAddress;
  index: number;
}> = ({ address, index }) => {
  const { updateAddress, deleteAddress } = useCustomerDispatch();
  const [editOpen, setEditOpen] = React.useState(false);

  const fullName = (address as any).fullName as string | undefined;
  const monogram = initialsOf(fullName, '');
  const lines = [
    (address as any).address1,
    (address as any).address2,
    [
      (address as any).city,
      (address as any).province?.name || (address as any).province,
      (address as any).postcode
    ]
      .filter(Boolean)
      .join(', '),
    ((address as any).country?.name || (address as any).country) as string,
    (address as any).telephone
  ].filter(Boolean);

  return (
    <div
      className="anroy-account__address"
      data-default={address.isDefault ? 'true' : 'false'}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {address.isDefault && (
        <span className="anroy-account__address-stamp">Principal</span>
      )}
      <span className="anroy-account__address-monogram">{monogram}</span>
      {fullName && <div className="anroy-account__address-name">{fullName}</div>}
      <div className="anroy-account__address-body">
        {lines.map((l, i) => (
          <div key={i}>{l as string}</div>
        ))}
      </div>
      <div className="anroy-account__address-actions">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger>
            <button
              type="button"
              className="anroy-account__chip"
              onClick={(e) => e.preventDefault()}
            >
              Editar
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar dirección</DialogTitle>
            </DialogHeader>
            <Form
              id={`addr-${address.uuid}`}
              method="PATCH"
              onSubmit={async (data) => {
                try {
                  await updateAddress(address.addressId, data);
                  setEditOpen(false);
                  toast.success('Dirección actualizada');
                } catch (e: any) {
                  toast.error(e?.message || 'Error al actualizar');
                }
              }}
            >
              <CustomerAddressForm address={address} fieldNamePrefix="" />
              <div className="mt-3">
                <CheckboxField
                  label="Usar como principal"
                  defaultChecked={!!address.isDefault}
                  name="is_default"
                />
              </div>
            </Form>
          </DialogContent>
        </Dialog>
        <button
          type="button"
          className="anroy-account__chip anroy-account__chip--danger"
          onClick={async () => {
            if (!confirm('¿Eliminar esta dirección?')) return;
            try {
              await deleteAddress(address.addressId);
              toast.success('Dirección eliminada');
            } catch (e: any) {
              toast.error(e?.message || 'Error al eliminar');
            }
          }}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default function MyAccount() {
  const { customer } = useCustomer();
  const { logout, addAddress } = useCustomerDispatch();
  const [addOpen, setAddOpen] = React.useState(false);

  if (!customer) {
    return null;
  }

  const orders = customer.orders || [];
  const addresses = customer.addresses || [];
  const firstName = (customer.fullName || '').split(' ')[0] || customer.email;
  const memberSince = formatMemberSince(customer.createdAt?.value);
  const tone = pickTone(customer.email || customer.uuid);
  const totalSpent = orders.reduce(
    (sum, o) => sum + (o.grandTotal?.value || 0),
    0
  );
  const formatTotal = (value: number) => {
    try {
      return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        maximumFractionDigits: 0
      }).format(value);
    } catch {
      return `RD$${value.toFixed(0)}`;
    }
  };
  const lastOrder = orders[0];

  const handleLogout = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    try {
      await logout();
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo cerrar sesión');
    }
  };

  const photoUrl = (customer as any).photoUrl as string | undefined;

  return (
    <div className="anroy-account">
      <div className="anroy-account__wrap">
        {/* Masthead */}
        <header className="anroy-account__masthead">
          <div
            className="anroy-account__avatar"
            style={{ background: tone }}
          >
            <span className="anroy-account__avatar-frame" aria-hidden />
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={customer.fullName}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="anroy-account__avatar-initials">
                {initialsOf(customer.fullName, customer.email)}
              </span>
            )}
          </div>

          <div className="anroy-account__hello-block">
            <span className="anroy-account__eyebrow">
              Tu boudoir
            </span>
            <h1 className="anroy-account__greeting">
              {greeting()},{' '}
              <span className="italic">{firstName}</span>
            </h1>
            <p className="anroy-account__sub">
              Acá vive tu historial, tus direcciones y todo lo que has
              elegido en Anroy.
              {memberSince && (
                <>
                  {' '}Sos miembro desde <b>{memberSince}</b>.
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            className="anroy-account__signout"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </header>

        {/* Stats strip */}
        <section className="anroy-account__stats" aria-label="Resumen">
          <div className="anroy-account__stat">
            <span className="anroy-account__stat__label">Pedidos</span>
            <span className="anroy-account__stat__value">{orders.length}</span>
            <span className="anroy-account__stat__hint">
              {orders.length === 0 ? 'Aún por estrenarte' : 'En tu historial'}
            </span>
          </div>
          <div className="anroy-account__stat">
            <span className="anroy-account__stat__label">Total invertido</span>
            <span className="anroy-account__stat__value">
              {formatTotal(totalSpent)}
            </span>
            <span className="anroy-account__stat__hint">
              Acumulado en tu cuenta
            </span>
          </div>
          <div className="anroy-account__stat">
            <span className="anroy-account__stat__label">Último envío</span>
            <span className="anroy-account__stat__value">
              {lastOrder?.createdAt?.text?.split(',')?.[0] || '—'}
            </span>
            <span className="anroy-account__stat__hint">
              {lastOrder?.status?.name || 'Aún sin pedidos'}
            </span>
          </div>
          <div className="anroy-account__stat">
            <span className="anroy-account__stat__label">Direcciones</span>
            <span className="anroy-account__stat__value">{addresses.length}</span>
            <span className="anroy-account__stat__hint">
              {addresses.length === 0 ? 'Sin direcciones aún' : 'Guardadas'}
            </span>
          </div>
        </section>

        {/* Orders */}
        <section className="anroy-account__section">
          <div className="anroy-account__section-head">
            <h2 className="anroy-account__section-title">
              Historial <span className="italic">de pedidos</span>
            </h2>
            <span className="anroy-account__section-kicker">
              {orders.length === 0 ? 'Aún vacío' : `${orders.length} pedidos`}
            </span>
          </div>
          {orders.length === 0 ? (
            <div className="anroy-account__empty">
              <span className="anroy-account__empty-mark" aria-hidden>
                ✦
              </span>
              <h3 className="anroy-account__empty-title">
                Tu primer esmalte te está esperando
              </h3>
              <p className="anroy-account__empty-sub">
                Cuando hagas un pedido lo vas a ver acá, con todos sus
                detalles, el estado del envío y el total cobrado.
              </p>
              <a href="/" className="anroy-account__empty-cta">
                Explorar la tienda
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </a>
            </div>
          ) : (
            <div className="anroy-account__orders">
              {orders.map((order, i) => (
                <OrderCard
                  order={order}
                  issueNumber={orders.length - 1 - i}
                  key={order.orderId}
                />
              ))}
            </div>
          )}
        </section>

        {/* Addresses */}
        <section className="anroy-account__section">
          <div className="anroy-account__section-head">
            <h2 className="anroy-account__section-title">
              Tus <span className="italic">direcciones</span>
            </h2>
            <span className="anroy-account__section-kicker">
              {addresses.length} guardada{addresses.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="anroy-account__addresses">
            {addresses.map((address, i) => (
              <AddressCard address={address} index={i} key={address.uuid} />
            ))}

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger>
                <button
                  type="button"
                  className="anroy-account__address-add"
                  onClick={(e) => e.preventDefault()}
                >
                  <span className="anroy-account__address-add__plus">+</span>
                  Añadir dirección
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva dirección</DialogTitle>
                </DialogHeader>
                <Form
                  id="new-address"
                  method="POST"
                  onSubmit={async (data) => {
                    try {
                      await addAddress(data as ExtendedCustomerAddress);
                      setAddOpen(false);
                      toast.success('Dirección guardada');
                    } catch (e: any) {
                      toast.error(e?.message || 'Error al guardar');
                    }
                  }}
                >
                  <CustomerAddressForm address={undefined} fieldNamePrefix="" />
                  <div className="mt-3">
                    <CheckboxField
                      label="Usar como principal"
                      defaultChecked={false}
                      name="is_default"
                    />
                  </div>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Editorial closer */}
        <section className="anroy-account__section">
          <div className="anroy-account__section-head">
            <h2 className="anroy-account__section-title">
              Próxima <span className="italic">edición</span>
            </h2>
            <span className="anroy-account__section-kicker">
              <Sparkles className="w-3 h-3 inline mr-1" strokeWidth={2} />
              Coming soon
            </span>
          </div>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
            lineHeight: 1.25,
            color: 'var(--ink-soft)',
            maxWidth: '40rem',
            margin: '0.5rem 0'
          }}>
            Estamos preparando una colección de tonos pasteles inspirada en
            las playas del este. Tu cuenta te avisará primero cuando se
            anuncie.
          </p>
        </section>
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};
