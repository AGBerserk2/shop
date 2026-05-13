import {
  describeFirebaseError,
  FirebaseWebConfig,
  getFirebaseClient
} from '@components/frontStore/auth/firebaseClient.js';
import { Form, useFormContext } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { Button } from '@components/common/ui/Button.js';
import { CheckCircle2, Mail, Sparkles } from 'lucide-react';
import React from 'react';
import { toast } from 'react-toastify';
import '../login/LoginPage.scss';

interface ResetPasswordPageProps {
  loginUrl: string;
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
      {isSubmitting ? 'Enviando…' : 'Enviarme el enlace'}
    </Button>
  );
}

export default function ResetPasswordPage({
  loginUrl,
  setting
}: ResetPasswordPageProps) {
  const storeName = setting?.storeName || 'Anroy';
  const firebaseConfig = setting?.firebaseConfig || null;
  const firebaseReady =
    !!firebaseConfig?.apiKey && !!firebaseConfig?.projectId;

  const [sent, setSent] = React.useState(false);
  const [sentEmail, setSentEmail] = React.useState<string>('');

  return (
    <div className="anroy-login-shell">
      <div className="anroy-login-grain" aria-hidden />

      <aside className="anroy-login-hero">
        <div className="anroy-login-hero__inner">
          <div className="anroy-login-hero__eyebrow">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{storeName} · Recuperar acceso</span>
          </div>
          <h1 className="anroy-login-hero__title">
            <span className="block">Tranquila,</span>
            <span className="block italic">te ayudamos</span>
          </h1>
          <p className="anroy-login-hero__lede">
            Mandanos tu correo y te enviamos un enlace seguro para que
            elijas una contraseña nueva.
          </p>
          <div className="anroy-login-hero__bottom">
            <span className="anroy-login-hero__dot" aria-hidden />
            <span className="text-sm">Llega en menos de un minuto</span>
          </div>
        </div>

        <div className="anroy-login-orb anroy-login-orb--a" aria-hidden />
        <div className="anroy-login-orb anroy-login-orb--b" aria-hidden />
        <div className="anroy-login-orb anroy-login-orb--c" aria-hidden />
      </aside>

      <main className="anroy-login-panel">
        <div className="anroy-login-card">
          {sent ? (
            <div className="anroy-login-success">
              <div className="anroy-login-success__icon">
                <CheckCircle2 className="w-7 h-7" strokeWidth={1.75} />
              </div>
              <h2 className="anroy-login-card__title">
                Revisá <span className="italic">tu correo</span>
              </h2>
              <p className="anroy-login-card__sub">
                Si {sentEmail ? <strong>{sentEmail}</strong> : 'ese correo'}{' '}
                está registrado, te enviamos un enlace para restablecer tu
                contraseña. El enlace expira en una hora.
              </p>
              <a href={loginUrl} className="anroy-login-submit inline-flex justify-center items-center" style={{ marginTop: '1.5rem', textDecoration: 'none' }}>
                Volver a iniciar sesión
              </a>
            </div>
          ) : firebaseReady ? (
            <>
              <div className="anroy-login-card__head">
                <span className="anroy-login-card__kicker">
                  Restablecer contraseña
                </span>
                <h2 className="anroy-login-card__title">
                  Cambiá tu <span className="italic">contraseña</span>
                </h2>
                <p className="anroy-login-card__sub">
                  Te mandamos un enlace por correo para crear una nueva.
                </p>
              </div>

              <Form
                id="resetForm"
                method="POST"
                onSubmit={async (data) => {
                  const email = (data.email as string).trim();
                  try {
                    const { auth, authMod } = await getFirebaseClient(
                      firebaseConfig!
                    );
                    await authMod.sendPasswordResetEmail(auth, email);
                    setSentEmail(email);
                    setSent(true);
                  } catch (e: any) {
                    // Don't leak which emails exist — show success even
                    // when Firebase returns user-not-found.
                    if (
                      e?.code === 'auth/user-not-found' ||
                      e?.code === 'auth/invalid-email'
                    ) {
                      setSentEmail(email);
                      setSent(true);
                      return;
                    }
                    toast.error(describeFirebaseError(e));
                  }
                }}
                onError={(err: any) =>
                  toast.error(err?.message || 'Revisá tu correo')
                }
                submitBtn={false}
              >
                <div className="anroy-login-fields">
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
                  <SubmitBtn />
                </div>
              </Form>

              <div className="anroy-login-footer">
                ¿Te acordaste?{' '}
                <a href={loginUrl} className="anroy-login-footer__link">
                  Volver al inicio de sesión
                </a>
              </div>
            </>
          ) : (
            <div className="anroy-login-misconfig">
              La recuperación de contraseña todavía no está configurada.
              Avisá al equipo para terminar la configuración de Firebase.
            </div>
          )}
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
    loginUrl: url(routeId: "login")
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
