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
import {
  ChevronLeft,
  Heart,
  Package,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  User
} from 'lucide-react';
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

function statusTone(
  code: string
): 'shipped' | 'delivered' | 'processing' | 'cancelled' {
  const c = (code || '').toLowerCase();
  if (c.includes('cancel')) return 'cancelled';
  if (c.includes('deliver') || c.includes('complete')) return 'delivered';
  if (c.includes('ship') || c.includes('dispatch')) return 'shipped';
  return 'processing';
}

const STATUS_LABEL: Record<string, string> = {
  delivered: 'Entregado',
  shipped: 'En envío',
  processing: 'En proceso',
  cancelled: 'Cancelado'
};

const SHORTCUTS: {
  label: string;
  icon: React.ReactNode;
  tone: 'rose' | 'mint' | 'sky' | 'lilac' | 'peach' | 'lemon';
  href: string;
}[] = [
  {
    label: 'Catálogo',
    tone: 'rose',
    href: '/',
    icon: <ShoppingBag className="w-3.5 h-3.5" strokeWidth={2.2} />
  },
  {
    label: 'Favoritos',
    tone: 'peach',
    href: '/favoritos',
    icon: <Heart className="w-3.5 h-3.5" strokeWidth={2.2} />
  },
  {
    label: 'Pedidos',
    tone: 'sky',
    href: '#pedidos',
    icon: <Package className="w-3.5 h-3.5" strokeWidth={2.2} />
  },
  {
    label: 'Cupones',
    tone: 'lemon',
    href: '#',
    icon: <Tag className="w-3.5 h-3.5" strokeWidth={2.2} />
  },
  {
    label: 'Buscar',
    tone: 'mint',
    href: '/?focus=search',
    icon: <Search className="w-3.5 h-3.5" strokeWidth={2.2} />
  },
  {
    label: 'Novedades',
    tone: 'lilac',
    href: '/?sort=newest',
    icon: <Sparkles className="w-3.5 h-3.5" strokeWidth={2.2} />
  }
];

const EditProfileDialog: React.FC<{
  open: boolean;
  onOpenChange: (b: boolean) => void;
  customer: {
    fullName: string;
    email: string;
    photoUrl?: string | null;
    uuid: string;
  };
}> = ({ open, onOpenChange, customer }) => {
  // We don't actually patch the customer in this PR (the backend
  // routes were retired with the Firebase migration), but the form is
  // wired and ready — toast a friendly notice on submit until the
  // /customer/me PATCH endpoint comes back.
  const initials = initialsOf(customer.fullName, customer.email);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>
        <div className="anroy-edit">
          <div className="anroy-edit__avatar-shell">
            <div className="anroy-edit__avatar">
              {customer.photoUrl ? (
                <img
                  src={customer.photoUrl}
                  alt={customer.fullName}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="anroy-edit__avatar-init">{initials}</span>
              )}
              <button
                type="button"
                className="anroy-edit__avatar-edit"
                aria-label="Cambiar foto"
              >
                <Pencil className="w-3 h-3" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.info('Próximamente podrás editar tu nombre desde acá');
            }}
          >
            <div className="anroy-edit__field">
              <label className="anroy-edit__label" htmlFor="ed-name">
                Nombre completo
              </label>
              <div className="anroy-edit__control">
                <input
                  id="ed-name"
                  className="anroy-edit__input"
                  defaultValue={customer.fullName}
                  placeholder="Tu nombre"
                />
                <span className="anroy-edit__suffix-icon">
                  <User className="w-4 h-4" strokeWidth={1.75} />
                </span>
              </div>
            </div>

            <div className="anroy-edit__field" style={{ marginTop: '1rem' }}>
              <label className="anroy-edit__label" htmlFor="ed-email">
                Correo electrónico
              </label>
              <div className="anroy-edit__control">
                <input
                  id="ed-email"
                  className="anroy-edit__input"
                  defaultValue={customer.email}
                  disabled
                  title="El correo se administra desde Firebase"
                />
              </div>
            </div>

            <div className="anroy-edit__field" style={{ marginTop: '1rem' }}>
              <label className="anroy-edit__label" htmlFor="ed-phone">
                Teléfono
              </label>
              <div className="anroy-edit__control">
                <input
                  id="ed-phone"
                  className="anroy-edit__input"
                  placeholder="+1 809 000 0000"
                />
                <span className="anroy-edit__suffix-icon">
                  <Phone className="w-4 h-4" strokeWidth={1.75} />
                </span>
              </div>
            </div>

            <button type="submit" className="anroy-edit__cta">
              Guardar cambios
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const OrderRow: React.FC<{ order: Order }> = ({ order }) => {
  const tone = statusTone(order.status?.code || order.status?.name || '');
  const firstItem = order.items?.[0];
  const itemsCount = order.items?.length || 0;
  return (
    <div className="anroy-profile__order">
      <span className="anroy-profile__order-icon">
        <Package className="w-5 h-5" strokeWidth={2} />
      </span>
      <div className="anroy-profile__order-body">
        <span className="anroy-profile__order-title">
          {firstItem?.productName || `Pedido #${order.orderNumber}`}
          {itemsCount > 1 && ` · +${itemsCount - 1}`}
        </span>
        <span className="anroy-profile__order-meta">
          <span className="anroy-profile__order-status" data-tone={tone}>
            {STATUS_LABEL[tone]}
          </span>
          <span>·</span>
          <span>#{order.orderNumber}</span>
          <span>·</span>
          <span>{order.createdAt?.text?.split(',')?.[0] || ''}</span>
        </span>
      </div>
      <span className="anroy-profile__order-total">
        {order.grandTotal?.text}
      </span>
    </div>
  );
};

const AddressRow: React.FC<{
  address: ExtendedCustomerAddress;
  index: number;
}> = ({ address, index }) => {
  const { updateAddress, deleteAddress } = useCustomerDispatch();
  const [editOpen, setEditOpen] = React.useState(false);
  const fullName = (address as any).fullName as string | undefined;

  const lineParts = [
    (address as any).address1,
    (address as any).address2,
    [
      (address as any).city,
      (address as any).province?.name || (address as any).province,
      (address as any).postcode
    ]
      .filter(Boolean)
      .join(', '),
    (address as any).country?.name || (address as any).country,
    (address as any).telephone
  ].filter(Boolean);

  return (
    <div
      className="anroy-profile__address"
      data-default={address.isDefault ? 'true' : 'false'}
    >
      <div className="anroy-profile__address-top">
        <span className="anroy-profile__address-name">
          {fullName || `Dirección ${index + 1}`}
        </span>
        {address.isDefault && (
          <span className="anroy-profile__address-tag">Principal</span>
        )}
      </div>
      <div className="anroy-profile__address-body">
        {lineParts.map((l, i) => (
          <div key={i}>{l as string}</div>
        ))}
      </div>
      <div className="anroy-profile__address-actions">
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger>
            <button
              type="button"
              className="anroy-profile__mini"
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
              submitBtnText="Guardar cambios"
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
          className="anroy-profile__mini anroy-profile__mini--danger"
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
  const [editOpen, setEditOpen] = React.useState(false);

  if (!customer) return null;

  const orders = customer.orders || [];
  const addresses = customer.addresses || [];
  const initials = initialsOf(customer.fullName, customer.email);
  const photoUrl = (customer as any).photoUrl as string | undefined;
  const firstName = (customer.fullName || '').split(' ')[0] || initials;
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

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo cerrar sesión');
    }
  };

  return (
    <div className="anroy-profile">
      <div className="anroy-profile__shell">
        {/* Top bar */}
        <div className="anroy-profile__bar">
          <a
            href="/"
            className="anroy-profile__back"
            aria-label="Volver"
            onClick={(e) => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                e.preventDefault();
                window.history.back();
              }
            }}
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.2} />
          </a>
          <span className="anroy-profile__title">Mi perfil</span>
          <span className="anroy-profile__menu" aria-hidden />
        </div>

        {/* Avatar block */}
        <div className="anroy-profile__avatar-wrap">
          <div className="anroy-profile__avatar">
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
              <span className="anroy-profile__avatar-initials">
                {initials}
              </span>
            )}
            <button
              type="button"
              className="anroy-profile__avatar-edit"
              aria-label="Editar perfil"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          </div>
          <h1 className="anroy-profile__name">
            {customer.fullName || firstName}
          </h1>
          <span className="anroy-profile__handle">{customer.email}</span>
        </div>

        {/* Stats */}
        <div className="anroy-profile__stats">
          <div className="anroy-profile__stat">
            <div className="anroy-profile__stat-value">{orders.length}</div>
            <div className="anroy-profile__stat-label">Pedidos</div>
          </div>
          <div className="anroy-profile__stat">
            <div className="anroy-profile__stat-value">
              {formatMoney(totalSpent)}
            </div>
            <div className="anroy-profile__stat-label">DOP totales</div>
          </div>
          <div className="anroy-profile__stat">
            <div className="anroy-profile__stat-value">{addresses.length}</div>
            <div className="anroy-profile__stat-label">Direcciones</div>
          </div>
        </div>

        {/* Shortcuts (interests) */}
        <section className="anroy-profile__section">
          <div className="anroy-profile__section-head">
            <span className="anroy-profile__section-title">Atajos</span>
          </div>
        </section>
        <div className="anroy-profile__chips">
          {SHORTCUTS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              className="anroy-profile__chip"
              data-tone={s.tone}
            >
              <span className="anroy-profile__chip-icon">{s.icon}</span>
              {s.label}
            </a>
          ))}
        </div>

        {/* Orders */}
        <section className="anroy-profile__section" id="pedidos">
          <div className="anroy-profile__section-head">
            <span className="anroy-profile__section-title">
              Pedidos recientes
            </span>
            {orders.length > 0 && (
              <a href="#" className="anroy-profile__section-link">
                Ver todos
              </a>
            )}
          </div>
        </section>
        {orders.length === 0 ? (
          <div className="anroy-profile__empty">
            <span className="anroy-profile__empty-icon">
              <Receipt className="w-6 h-6" strokeWidth={2} />
            </span>
            <h3 className="anroy-profile__empty-title">
              Aún no tenés pedidos
            </h3>
            <p className="anroy-profile__empty-sub">
              Cuando hagas tu primer pedido en Anroy lo vas a ver acá con
              todos sus detalles y el estado del envío.
            </p>
            <a href="/" className="anroy-profile__empty-cta">
              <ShoppingBag className="w-4 h-4" strokeWidth={2.2} />
              Explorar tienda
            </a>
          </div>
        ) : (
          <div className="anroy-profile__orders">
            {orders.slice(0, 5).map((order) => (
              <OrderRow order={order} key={order.orderId} />
            ))}
          </div>
        )}

        {/* Addresses */}
        <section className="anroy-profile__section" id="direcciones">
          <div className="anroy-profile__section-head">
            <span className="anroy-profile__section-title">Direcciones</span>
            <span className="anroy-profile__section-link">
              {addresses.length} guardada{addresses.length === 1 ? '' : 's'}
            </span>
          </div>
        </section>
        <div className="anroy-profile__addresses">
          {addresses.map((address, i) => (
            <AddressRow address={address} index={i} key={address.uuid} />
          ))}

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger>
              <button
                type="button"
                className="anroy-profile__address-add"
                onClick={(e) => e.preventDefault()}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
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
                submitBtnText="Guardar dirección"
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

        {/* Sign out */}
        <div className="anroy-profile__signout-row">
          <button
            type="button"
            className="anroy-profile__signout"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>

        {/* Bottom navigation is now mounted globally via
            packages/evershop/src/modules/base/pages/frontStore/all/MobileTabBar.tsx
            so it appears on every storefront page, not just /account. */}
      </div>

      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={{
          fullName: customer.fullName || '',
          email: customer.email,
          uuid: customer.uuid,
          photoUrl
        }}
      />
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};
