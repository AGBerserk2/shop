// Lazy initializer for the Firebase client SDK on the storefront.
// We keep Firebase out of the initial bundle and only load it once a
// user starts an auth flow (login, register, reset password).

export interface FirebaseWebConfig {
  apiKey: string | null;
  authDomain: string | null;
  projectId: string | null;
  appId: string | null;
}

export type FirebaseClient = {
  auth: import('firebase/auth').Auth;
  authMod: typeof import('firebase/auth');
};

let cachedPromise: Promise<FirebaseClient> | null = null;

export async function getFirebaseClient(
  config: FirebaseWebConfig
): Promise<FirebaseClient> {
  if (!config.apiKey || !config.projectId) {
    throw new Error('Firebase no está configurado');
  }
  if (cachedPromise) return cachedPromise;

  cachedPromise = (async () => {
    const [{ initializeApp, getApps, getApp }, authMod] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth')
    ]);
    const fbConfig = {
      apiKey: config.apiKey!,
      authDomain:
        config.authDomain || `${config.projectId}.firebaseapp.com`,
      projectId: config.projectId!,
      appId: config.appId || undefined
    };
    const app = getApps().length ? getApp() : initializeApp(fbConfig);
    const auth = authMod.getAuth(app);
    auth.languageCode = 'es';
    return { auth, authMod };
  })();

  return cachedPromise;
}

// Friendly Spanish copy for the common Firebase Auth error codes so we
// surface useful toasts instead of the raw "auth/foo" identifiers.
const ERROR_MESSAGES: Record<string, string> = {
  'auth/popup-closed-by-user': 'Cerraste la ventana antes de terminar',
  'auth/cancelled-popup-request': 'Se canceló la ventana anterior',
  'auth/popup-blocked':
    'Tu navegador bloqueó la ventana emergente. Permitila e intentá de nuevo.',
  'auth/network-request-failed': 'Problema de conexión',
  'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase',
  'auth/email-already-in-use':
    'Ya existe una cuenta con ese correo. Probá iniciar sesión.',
  'auth/invalid-email': 'El correo no parece válido',
  'auth/weak-password': 'Elegí una contraseña con al menos 6 caracteres',
  'auth/user-not-found': 'No encontramos una cuenta con ese correo',
  'auth/wrong-password': 'Correo o contraseña incorrectos',
  'auth/invalid-credential': 'Correo o contraseña incorrectos',
  'auth/too-many-requests':
    'Demasiados intentos. Esperá un momento o usá restablecer contraseña.'
};

export function describeFirebaseError(error: any): string {
  const code = error?.code as string | undefined;
  return (
    (code && ERROR_MESSAGES[code]) ||
    error?.message ||
    'Hubo un problema con la autenticación'
  );
}

export async function postFirebaseSession(
  authUrl: string,
  credential: string,
  fullName?: string
): Promise<void> {
  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, fullName })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      json?.error?.message || 'No pudimos completar la autenticación'
    );
  }
}
