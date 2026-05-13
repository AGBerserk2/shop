import { CircleUser } from 'lucide-react';
import React from 'react';

interface UserIconProps {
  customer: {
    uuid: string;
    fullName: string;
    email: string;
    photoUrl?: string | null;
  } | null;
  accountUrl: string;
  loginUrl: string;
}

// Pleasant, deterministic background per user — hashes the email to one
// of a few warm pastel tones so the same person always gets the same
// avatar color across sessions.
const AVATAR_TONES = [
  'bg-rose-200 text-rose-900',
  'bg-amber-200 text-amber-900',
  'bg-emerald-200 text-emerald-900',
  'bg-sky-200 text-sky-900',
  'bg-violet-200 text-violet-900',
  'bg-orange-200 text-orange-900',
  'bg-fuchsia-200 text-fuchsia-900',
  'bg-teal-200 text-teal-900'
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

export default function UserIcon({
  customer,
  accountUrl,
  loginUrl
}: UserIconProps) {
  const [photoBroken, setPhotoBroken] = React.useState(false);

  if (!customer) {
    return (
      <div className="self-center customer-icon">
        <a
          href={loginUrl}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          aria-label="Iniciar sesión"
          title="Iniciar sesión"
        >
          <CircleUser className="w-[18px] h-[18px]" strokeWidth={1.75} />
        </a>
      </div>
    );
  }

  const hasPhoto = !!customer.photoUrl && !photoBroken;
  const initials = initialsOf(customer.fullName, customer.email);
  const tone = pickTone(customer.email || customer.uuid);
  const label = customer.fullName || customer.email || 'Mi cuenta';

  // The `md:flex hidden` keeps this icon out of the mobile header when
  // the user is already logged in — the bottom tab bar carries the
  // 'Perfil' shortcut on small screens so showing it twice is noise.
  return (
    <div className="self-center customer-icon md:flex hidden">
      <a
        href={accountUrl}
        className="block w-10 h-10 rounded-full overflow-hidden ring-1 ring-black/5 hover:ring-rose-300 transition-all"
        aria-label={`Cuenta de ${label}`}
        title={label}
      >
        {hasPhoto ? (
          <img
            src={customer.photoUrl as string}
            alt={label}
            referrerPolicy="no-referrer"
            onError={() => setPhotoBroken(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span
            className={`w-full h-full flex items-center justify-center text-[13px] font-semibold ${tone}`}
            aria-hidden
          >
            {initials}
          </span>
        )}
      </a>
    </div>
  );
}

export const layout = {
  areaId: 'headerMiddleRight',
  sortOrder: 10
};

export const query = `
  query Query {
    customer: currentCustomer {
      uuid
      fullName
      email
      photoUrl
    }
    accountUrl: url(routeId: "account")
    loginUrl: url(routeId: "login")
  }
`;
