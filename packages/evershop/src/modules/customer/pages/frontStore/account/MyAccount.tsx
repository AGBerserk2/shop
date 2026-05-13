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
import React from 'react';
import { toast } from 'react-toastify';
import './MyAccount.scss';

function initialsOf(name?: string | null, email?: string | null): string {
  const source = (name && name.trim()) || (email && email.split('@')[0]) || '';
  if (!source) return '??';
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

const STATUS_LABEL: Record<string, string> = {
  delivered: 'Entregado',
  shipped: 'En Tránsito',
  processing: 'En Proceso',
  cancelled: 'Cancelado'
};

function fileNumber(seed: string): string {
  // Stable 5-digit case number derived from the customer uuid/email.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return String(h % 99999).padStart(5, '0');
}

function formatMember(value?: string): string {
  if (!value) return '—';
  try {
    return new Date(value)
      .toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' })
      .replace(/\//g, '.');
  } catch {
    return '—';
  }
}

function today(): string {
  return new Date()
    .toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .replace(/\//g, '.');
}

function shortDate(value?: string): string {
  if (!value) return '—';
  try {
    return new Date(value)
      .toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: '2-digit' })
      .replace(/\//g, '.');
  } catch {
    return '—';
  }
}

const Specimen: React.FC<{ order: Order; index: number; total: number }> = ({
  order,
  index,
  total
}) => {
  const tone = statusTone(order.status?.code || order.status?.name || '');
  const specimenNum = String(total - index).padStart(3, '0');
  const items = order.items || [];
  const firstItem = items[0];

  return (
    <div className="anroy-lab__specimen">
      <div className="anroy-lab__specimen-num">
        <small>Muestra</small>
        {specimenNum}
      </div>

      <div className="anroy-lab__specimen-date">
        <small>Registro</small>
        {shortDate(order.createdAt?.value)}
      </div>

      <div className="anroy-lab__specimen-items">
        <div className="anroy-lab__specimen-items-line">
          {firstItem ? firstItem.productName : '— pedido vacío —'}
        </div>
        {items.length > 1 && (
          <div className="anroy-lab__specimen-items-more">
            + {items.length - 1} muestra{items.length - 1 === 1 ? '' : 's'} adicional{items.length - 1 === 1 ? '' : 'es'}
          </div>
        )}
      </div>

      <div className="anroy-lab__specimen-status" data-tone={tone}>
        {STATUS_LABEL[tone]}
      </div>

      <div className="anroy-lab__specimen-total">
        <small>DOP</small>
        {order.grandTotal?.text || '—'}
      </div>
    </div>
  );
};

const LocationCard: React.FC<{
  address: ExtendedCustomerAddress;
  index: number;
}> = ({ address, index }) => {
  const { updateAddress, deleteAddress } = useCustomerDispatch();
  const [editOpen, setEditOpen] = React.useState(false);

  const fullName = (address as any).fullName as string | undefined;
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
      className="anroy-lab__location"
      data-default={address.isDefault ? 'true' : 'false'}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="anroy-lab__location-marker">
        <span className="label">Loc · {String(index + 1).padStart(2, '0')}</span>
        {address.isDefault && <span className="badge">★ Principal</span>}
      </div>

      {fullName && (
        <div className="anroy-lab__location-name">{fullName}</div>
      )}

      <div className="anroy-lab__location-body">
        {lines.map((l, i) => (
          <div key={i}>{l as string}</div>
        ))}
      </div>

      <div className="anroy-lab__location-actions">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger>
            <button
              type="button"
              className="anroy-lab__btn"
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
          className="anroy-lab__btn anroy-lab__btn--danger"
          onClick={async () => {
            if (!confirm('¿Eliminar esta dirección del expediente?')) return;
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

  if (!customer) return null;

  const orders = customer.orders || [];
  const addresses = customer.addresses || [];
  const fileNum = fileNumber(customer.uuid || customer.email);
  const memberSince = formatMember(customer.createdAt?.value);
  const totalSpent = orders.reduce(
    (s, o) => s + (o.grandTotal?.value || 0),
    0
  );
  const formatMoney = (v: number) => {
    try {
      return new Intl.NumberFormat('es-DO', {
        maximumFractionDigits: 0
      }).format(v);
    } catch {
      return v.toFixed(0);
    }
  };

  const photoUrl = (customer as any).photoUrl as string | undefined;
  const initials = initialsOf(customer.fullName, customer.email);
  const firstName = (customer.fullName || '').split(' ')[0] || initials;
  const surname = (customer.fullName || '').split(' ').slice(1).join(' ');

  const handleLogout = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    try {
      await logout();
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo cerrar sesión');
    }
  };

  const lastOrder = orders[0];

  return (
    <div className="anroy-lab">
      <div className="anroy-lab__wrap">
        {/* Document strip header */}
        <div className="anroy-lab__top-strip">
          <span>Anroy / Archivo Cliente / V.1</span>
          <span className="right">
            <span>FOLIO · {fileNum}</span>
            <span className="pulse">Sesión activa</span>
            <span>{today()}</span>
          </span>
        </div>

        {/* Case file header */}
        <header className="anroy-lab__header">
          <div className="anroy-lab__avatar">
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
              <span className="anroy-lab__avatar-initials">{initials}</span>
            )}
            <span className="anroy-lab__avatar-tag">muestra · 01</span>
          </div>

          <div className="anroy-lab__identity">
            <span className="anroy-lab__file-num">
              Expediente <strong>N°{fileNum}</strong>
            </span>
            <h1 className="anroy-lab__name">
              {firstName}
              {surname && (
                <span className="anroy-lab__name-suffix">{surname}</span>
              )}
            </h1>
            <div className="anroy-lab__bio">
              <dl>
                <dt>Correo</dt>
                <dd>{customer.email}</dd>
                <dt>Activo desde</dt>
                <dd>{memberSince}</dd>
                <dt>Pedidos registrados</dt>
                <dd>{String(orders.length).padStart(3, '0')}</dd>
              </dl>
            </div>
          </div>

          <div className="anroy-lab__stamp" aria-hidden>
            Acceso<br />Concedido
            <small>{today()}</small>
          </div>

          <button
            type="button"
            className="anroy-lab__signout"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </header>

        {/* Readout strip */}
        <section className="anroy-lab__readout" aria-label="Indicadores">
          <div className="anroy-lab__cell">
            <span className="anroy-lab__cell-tag">Pedidos</span>
            <span className="anroy-lab__cell-value">
              {String(orders.length).padStart(2, '0')}
              <span className="anroy-lab__cell-unit">muestras</span>
            </span>
            <span className="anroy-lab__cell-note">
              {orders.length === 0 ? 'archivo vacío' : 'en archivo'}
            </span>
          </div>
          <div className="anroy-lab__cell">
            <span className="anroy-lab__cell-tag">Inversión</span>
            <span className="anroy-lab__cell-value">
              {formatMoney(totalSpent)}
              <span className="anroy-lab__cell-unit">DOP</span>
            </span>
            <span className="anroy-lab__cell-note">acumulada · histórica</span>
          </div>
          <div className="anroy-lab__cell">
            <span className="anroy-lab__cell-tag">Último ingreso</span>
            <span className="anroy-lab__cell-value">
              {shortDate(lastOrder?.createdAt?.value)}
            </span>
            <span className="anroy-lab__cell-note">
              {lastOrder?.status?.name || '—'}
            </span>
          </div>
          <div className="anroy-lab__cell">
            <span className="anroy-lab__cell-tag">Locaciones</span>
            <span className="anroy-lab__cell-value">
              {String(addresses.length).padStart(2, '0')}
              <span className="anroy-lab__cell-unit">reg</span>
            </span>
            <span className="anroy-lab__cell-note">
              {addresses.length === 0 ? 'sin registrar' : 'campo activo'}
            </span>
          </div>
        </section>

        {/* Specimens (orders) */}
        <section className="anroy-lab__section">
          <div className="anroy-lab__section-head">
            <h2 className="anroy-lab__section-title">
              Registros / Pedidos
            </h2>
            <span className="anroy-lab__section-meta">
              {orders.length === 0 ? 'archivo vacío' : `${String(orders.length).padStart(3, '0')} entradas · ord. descendente`}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="anroy-lab__empty">
              <span className="anroy-lab__empty-glyph" aria-hidden>※</span>
              <h3 className="anroy-lab__empty-title">
                Archivo Sin Muestras
              </h3>
              <p className="anroy-lab__empty-sub">
                Tu primer pedido se va a archivar acá con todos sus datos:
                muestra, fecha, estado, total cobrado.
              </p>
              <a href="/" className="anroy-lab__cta">
                Ir al catálogo
              </a>
            </div>
          ) : (
            <div className="anroy-lab__specimens">
              <div className="anroy-lab__row-head">
                <span>N° Muestra</span>
                <span>Registro</span>
                <span>Contenido</span>
                <span>Estado</span>
                <span style={{ textAlign: 'right' }}>Total · DOP</span>
              </div>
              {orders.map((order, i) => (
                <Specimen
                  order={order}
                  index={i}
                  total={orders.length}
                  key={order.orderId}
                />
              ))}
            </div>
          )}
        </section>

        {/* Field locations (addresses) */}
        <section className="anroy-lab__section">
          <div className="anroy-lab__section-head">
            <h2 className="anroy-lab__section-title">
              Locaciones / Envío
            </h2>
            <span className="anroy-lab__section-meta">
              {String(addresses.length).padStart(2, '0')} ubicación
              {addresses.length === 1 ? '' : 'es'} registrada
              {addresses.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="anroy-lab__locations">
            {addresses.map((address, i) => (
              <LocationCard address={address} index={i} key={address.uuid} />
            ))}

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger>
                <button
                  type="button"
                  className="anroy-lab__location-add"
                  onClick={(e) => e.preventDefault()}
                >
                  <span className="anroy-lab__location-add__sigil">+</span>
                  Añadir locación
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
                      toast.success('Locación archivada');
                    } catch (e: any) {
                      toast.error(e?.message || 'Error al guardar');
                    }
                  }}
                >
                  <CustomerAddressForm address={undefined} fieldNamePrefix="" />
                  <div className="mt-3">
                    <CheckboxField
                      label="Marcar como principal"
                      defaultChecked={false}
                      name="is_default"
                    />
                  </div>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Document footer */}
        <div className="anroy-lab__doc-footer">
          <span>Doc · 2026.{today()}</span>
          <span className="seal">⊛ Sellado por Anroy · Santo Domingo, RD</span>
          <span>Pág. 01 / 01</span>
        </div>
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};
