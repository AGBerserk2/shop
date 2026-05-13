import { useAppDispatch } from '@components/common/context/app.js';
import {
  describeFirebaseError,
  FirebaseWebConfig,
  getFirebaseClient,
  postFirebaseSession
} from '@components/frontStore/auth/firebaseClient.js';
import { Form, useFormContext } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { PasswordField } from '@components/common/form/PasswordField.js';
import { Button } from '@components/common/ui/Button.js';
import { LockKeyhole, Mail, Sparkles, User } from 'lucide-react';
import React from 'react';
import { toast } from 'react-toastify';
import '../login/LoginPage.scss';

interface RegisterPageProps {
  homeUrl: string;
  loginUrl: string;
  authUrl: string;
  setting?: {
    storeName: string | null;
    firebaseConfig: FirebaseWebConfig | null;
  };
}

function SubmitBtn() {
  const {
    formState: { isSubmitting }
  } = useFormContext();
  return (
    <Button
      type="submit"
      className="w-full anroy-login-submit"
      size="lg"
      isLoading={isSubmitting}
    >
      {isSubmitting ? 'Creando cuenta…' : 'Crear mi cuenta'}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.63z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.87-3.04.87-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.73a5.41 5.41 0 0 1 0-3.45V4.96H.96a9 9 0 0 0 0 8.08l3.01-2.31z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.96L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function RegisterPage({
  homeUrl,
  loginUrl,
  authUrl,
  setting
}: RegisterPageProps) {
  const storeName = setting?.storeName || 'Anroy';
  const firebaseConfig = setting?.firebaseConfig || null;
  const firebaseReady =
    !!firebaseConfig?.apiKey && !!firebaseConfig?.projectId;

  const appDispatch = useAppDispatch();
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const refreshAndRedirect = React.useCallback(async () => {
    const ajaxUrl = (() => {
      const u = new URL(window.location.href);
      u.searchParams.set('ajax', 'true');
      return u.toString();
    })();
    await appDispatch.fetchPageData(ajaxUrl);
    window.location.href = homeUrl;
  }, [appDispatch, homeUrl]);

  const handleGoogleSignup = React.useCallback(async () => {
    if (!firebaseReady || googleLoading) return;
    setGoogleLoading(true);
    try {
      const { auth, authMod } = await getFirebaseClient(firebaseConfig!);
      const provider = new authMod.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await authMod.signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      await postFirebaseSession(
        authUrl,
        token,
        result.user.displayName || undefined
      );
      await refreshAndRedirect();
    } catch (e: any) {
      toast.error(describeFirebaseError(e));
      setGoogleLoading(false);
    }
  }, [
    firebaseReady,
    firebaseConfig,
    googleLoading,
    authUrl,
    refreshAndRedirect
  ]);

  return (
    <div className="anroy-login-shell">
      <div className="anroy-login-grain" aria-hidden />

      <aside className="anroy-login-hero">
        <div className="anroy-login-hero__inner">
          <div className="anroy-login-hero__eyebrow">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{storeName} · Esmaltes</span>
          </div>
          <h1 className="anroy-login-hero__title">
            <span className="block">Tu firma</span>
            <span className="block italic">en cada uña</span>
          </h1>
          <p className="anroy-login-hero__lede">
            Creá tu cuenta para guardar tus favoritos, seguir tus pedidos y
            recibir primero las ediciones limitadas.
          </p>
          <div className="anroy-login-hero__bottom">
            <span className="anroy-login-hero__dot" aria-hidden />
            <span className="text-sm">
              Te toma menos de un minuto
            </span>
          </div>
        </div>

        <div className="anroy-login-orb anroy-login-orb--a" aria-hidden />
        <div className="anroy-login-orb anroy-login-orb--b" aria-hidden />
        <div className="anroy-login-orb anroy-login-orb--c" aria-hidden />
      </aside>

      <main className="anroy-login-panel">
        <div className="anroy-login-card">
          <div className="anroy-login-card__head">
            <span className="anroy-login-card__kicker">Crear cuenta</span>
            <h2 className="anroy-login-card__title">
              Unite a <span className="italic">{storeName}</span>
            </h2>
            <p className="anroy-login-card__sub">
              Registrate con tu correo o vinculá tu cuenta de Google.
            </p>
          </div>

          {firebaseReady ? (
            <>
              <div className="anroy-login-google">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading}
                  className="anroy-login-google__btn"
                  aria-label="Registrarme con Google"
                >
                  <GoogleIcon />
                  <span>
                    {googleLoading
                      ? 'Conectando…'
                      : 'Registrarme con Google'}
                  </span>
                </button>
                <div className="anroy-login-divider">
                  <span>o con tu correo</span>
                </div>
              </div>

              <Form
                id="registerForm"
                method="POST"
                onSubmit={async (data) => {
                  try {
                    const fullName = (data.full_name as string).trim();
                    const email = (data.email as string).trim();
                    const password = data.password as string;
                    const { auth, authMod } = await getFirebaseClient(
                      firebaseConfig!
                    );
                    const cred =
                      await authMod.createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                      );
                    if (cred.user && fullName) {
                      await authMod.updateProfile(cred.user, {
                        displayName: fullName
                      });
                    }
                    const token = await cred.user.getIdToken();
                    await postFirebaseSession(authUrl, token, fullName);
                    await refreshAndRedirect();
                  } catch (e: any) {
                    toast.error(describeFirebaseError(e));
                  }
                }}
                onError={(err: any) =>
                  toast.error(err?.message || 'Revisá los datos')
                }
                submitBtn={false}
              >
                <div className="anroy-login-fields">
                  <InputField
                    prefixIcon={
                      <User className="w-4 h-4" strokeWidth={1.75} />
                    }
                    label="Nombre completo"
                    name="full_name"
                    placeholder="Tu nombre"
                    required
                    validation={{ required: 'El nombre es obligatorio' }}
                  />
                  <InputField
                    prefixIcon={
                      <Mail className="w-4 h-4" strokeWidth={1.75} />
                    }
                    label="Correo electrónico"
                    name="email"
                    placeholder="tucorreo@ejemplo.com"
                    required
                    validation={{ required: 'El correo es obligatorio' }}
                  />
                  <PasswordField
                    prefixIcon={
                      <LockKeyhole
                        className="w-4 h-4"
                        strokeWidth={1.75}
                      />
                    }
                    label="Contraseña"
                    name="password"
                    placeholder="Mínimo 6 caracteres"
                    required
                    validation={{
                      required: 'La contraseña es obligatoria',
                      minLength: {
                        value: 6,
                        message: 'La contraseña debe tener al menos 6 caracteres'
                      }
                    }}
                    showToggle
                  />
                  <SubmitBtn />
                </div>
              </Form>
            </>
          ) : (
            <div className="anroy-login-misconfig">
              El registro todavía no está configurado. Avisá al equipo para
              terminar la configuración de Firebase.
            </div>
          )}

          <div className="anroy-login-footer">
            ¿Ya tenés cuenta?{' '}
            <a href={loginUrl} className="anroy-login-footer__link">
              Iniciá sesión
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    homeUrl: url(routeId: "homepage")
    loginUrl: url(routeId: "login")
    authUrl: url(routeId: "customerAuthFirebaseJson")
    setting {
      storeName
      firebaseConfig {
        apiKey
        authDomain
        projectId
        appId
      }
    }
  }
`;
