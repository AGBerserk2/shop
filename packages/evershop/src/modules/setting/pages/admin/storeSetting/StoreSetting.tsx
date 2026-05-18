import { FileBrowser } from '@components/admin/FileBrowser.js';
import { SettingMenu } from '@components/admin/SettingMenu.js';
import Spinner from '@components/admin/Spinner.js';
import Area from '@components/common/Area.js';
import { EmailField } from '@components/common/form/EmailField.js';
import { Form, useFormContext } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { SelectField } from '@components/common/form/SelectField.js';
import { TelField } from '@components/common/form/TelField.js';
import { TextareaField } from '@components/common/form/TextareaField.js';
import { Button } from '@components/common/ui/Button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@components/common/ui/Dialog.js';
import { Item } from '@components/common/ui/Item.js';
import { Skeleton } from '@components/common/ui/Skeleton.js';
import axios from 'axios';
import { AtSign, Check, Facebook, HelpCircle, ImagePlus, Instagram, Link2, Loader2, MessageCircle, Music2, Package, RotateCcw, Trash2, Truck, Twitter, Upload } from 'lucide-react';
import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useQuery } from 'urql';

const ProvincesQuery = `
  query Province($countries: [String]) {
    provinces (countries: $countries) {
      code
      name
      countryCode
    }
  }
`;

const CountriesQuery = `
  query Country($countries: [String]) {
    countries (countries: $countries) {
      code
      name
    }
  }
`;

const Province: React.FC<{
  selectedCountry: string;
  selectedProvince: string;
  allowedCountries?: string[];
  fieldName?: string;
}> = ({
  selectedCountry = 'US',
  selectedProvince,
  allowedCountries = [],
  fieldName = 'storeProvince'
}) => {
  const { setValue } = useFormContext();

  const [result] = useQuery({
    query: ProvincesQuery,
    variables: { countries: allowedCountries }
  });
  const { data, fetching, error } = result;
  useEffect(() => {
    if (fetching || !data) return;
    const provinces = data.provinces.filter(
      (p) => p.countryCode === selectedCountry
    );
    if (provinces.every((p) => p.code !== selectedProvince)) {
      setValue(fieldName, '');
    }
  }, [selectedCountry, fetching]);
  if (fetching)
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="w-1/2 h-5 rounded-md" />
        <Skeleton className="w-full h-9 rounded-md" />
      </div>
    );
  if (error) {
    return <p className="text-destructive">{error.message}</p>;
  }
  const provinces = data.provinces.filter(
    (p) => p.countryCode === selectedCountry
  );
  if (!provinces.length) {
    return null;
  }

  return (
    <div>
      <SelectField
        id="storeProvince"
        defaultValue={selectedProvince}
        name={fieldName}
        label="Provincia"
        placeholder="Provincia"
        required
        options={provinces.map((p) => ({ value: p.code, label: p.name }))}
      />
    </div>
  );
};

const Country: React.FC<{
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  allowedCountries?: string[];
  fieldName?: string;
}> = ({
  selectedCountry,
  setSelectedCountry,
  allowedCountries = [],
  fieldName = 'storeCountry'
}) => {
  const onChange = (value: string) => {
    setSelectedCountry(value);
  };
  const [result] = useQuery({
    query: CountriesQuery,
    variables: { countries: allowedCountries }
  });

  const { data, fetching, error } = result;

  if (fetching)
    return (
      <Item variant={'outline'}>
        <Spinner width={'2rem'} height={'2rem'} />
      </Item>
    );
  if (error) {
    return <p className="text-destructive">{error.message}</p>;
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <SelectField
        defaultValue={selectedCountry}
        name={fieldName}
        label="País"
        placeholder="País"
        onChange={onChange}
        required
        options={data.countries.map((c) => ({ value: c.code, label: c.name }))}
      />
    </div>
  );
};

const StorePhoneNumber: React.FC<{ storePhoneNumber: string }> = ({
  storePhoneNumber
}) => {
  return (
    <div>
      <TelField
        name="storePhoneNumber"
        label="Teléfono de la tienda"
        placeholder="Teléfono de la tienda"
        defaultValue={storePhoneNumber}
      />
    </div>
  );
};

const StoreEmail: React.FC<{ storeEmail: string }> = ({ storeEmail }) => {
  return (
    <div>
      <EmailField
        name="storeEmail"
        label="Correo de la tienda"
        placeholder="Correo de la tienda"
        defaultValue={storeEmail}
      />
    </div>
  );
};

// Inline SVG: a soft 8px checkerboard, used to show transparency honestly
// (so a white-on-white logo looks "missing" instead of "perfect").
const CHECKER_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><rect width='8' height='8' fill='%23F5F5F5'/><rect x='8' y='8' width='8' height='8' fill='%23F5F5F5'/></svg>\")";

type LogoSaveState = 'idle' | 'saving' | 'saved' | 'error';

const StoreLogo: React.FC<{
  storeLogo: string | null;
  storeLogoAlt: string | null;
  saveApi: string;
}> = ({ storeLogo, storeLogoAlt, saveApi }) => {
  const { register, watch, setValue } = useFormContext();
  const [openBrowser, setOpenBrowser] = React.useState(false);
  const [saveState, setSaveState] = React.useState<LogoSaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  // Local mirror of the logo URL so the preview re-renders instantly on pick
  // (react-hook-form's `watch` doesn't always re-fire after `setValue`).
  const [currentLogo, setCurrentLogo] = React.useState<string>(storeLogo || '');
  const altDebounce = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    register('storeLogo');
  }, [register]);

  // Sync default on mount
  React.useEffect(() => {
    setValue('storeLogo', storeLogo || '');
  }, []);

  // Hits the saveSetting API immediately with just the logo fields so the
  // user gets feedback without having to scroll down to the form's Save button.
  const saveInline = async (payload: Record<string, string>, message: string) => {
    setSaveState('saving');
    try {
      const res = await axios.post(saveApi, payload, {
        validateStatus: () => true
      });
      if (res.status >= 200 && res.status < 300) {
        setSaveState('saved');
        setLastSavedAt(new Date());
        toast.success(message);
        // Auto-clear the "saved" badge after a few seconds.
        setTimeout(() => setSaveState('idle'), 2500);
      } else {
        setSaveState('error');
        toast.error(res.data?.error?.message || 'No se pudo guardar el logo');
      }
    } catch (e: any) {
      setSaveState('error');
      toast.error(e?.message || 'Error de conexión al guardar el logo');
    }
  };

  // FileBrowser passes the URL as a string, not an object — handle both for
  // safety so future API changes don't silently break this.
  const handlePick = (file: string | { url: string; name?: string }) => {
    const url = typeof file === 'string' ? file : file?.url;
    if (!url) return;
    setCurrentLogo(url);
    setValue('storeLogo', url, { shouldDirty: true });
    setOpenBrowser(false);
    saveInline(
      { storeLogo: url, storeLogoAlt: watch('storeLogoAlt') || '' },
      'Logo actualizado en la tienda'
    );
  };

  const handleClear = () => {
    if (!confirm('¿Quitar el logo actual? El header volverá al logo por defecto.')) {
      return;
    }
    setCurrentLogo('');
    setValue('storeLogo', '', { shouldDirty: true });
    saveInline({ storeLogo: '' }, 'Logo eliminado');
  };

  const handleAltBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newAlt = e.target.value;
    if (newAlt === (storeLogoAlt || '')) return; // no change
    if (altDebounce.current) clearTimeout(altDebounce.current);
    altDebounce.current = setTimeout(() => {
      saveInline({ storeLogoAlt: newAlt }, 'Texto alt guardado');
    }, 200);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Preview area — big, dropzone-style */}
        <div className="space-y-3">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setOpenBrowser(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpenBrowser(true);
              }
            }}
            className={`group relative w-full aspect-[3/1] rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
              currentLogo
                ? 'border-border hover:border-primary/60'
                : 'border-muted-foreground/25 hover:border-primary/60 bg-muted/20'
            }`}
            style={
              currentLogo
                ? {
                    backgroundImage: CHECKER_BG,
                    backgroundSize: '16px 16px'
                  }
                : undefined
            }
          >
            {currentLogo ? (
              <>
                <img
                  src={currentLogo}
                  alt="Vista previa del logo"
                  className="absolute inset-0 w-full h-full object-contain p-6"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium">
                    <Upload className="w-4 h-4" />
                    Cambiar logo
                  </div>
                </div>
                {/* Saving / saved badge top-right of the preview */}
                {saveState !== 'idle' && (
                  <div
                    className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm transition-all ${
                      saveState === 'saving'
                        ? 'bg-white text-foreground'
                        : saveState === 'saved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-destructive text-white'
                    }`}
                  >
                    {saveState === 'saving' && (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Guardando…
                      </>
                    )}
                    {saveState === 'saved' && (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Guardado
                      </>
                    )}
                    {saveState === 'error' && <>Error al guardar</>}
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <ImagePlus className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Sube el logo de tu tienda
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click aquí o arrastra una imagen
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            {currentLogo ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenBrowser(true)}
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  Cambiar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                >
                  <Trash2 className="w-4 h-4 mr-1.5 text-destructive" />
                  <span className="text-destructive">Quitar logo</span>
                </Button>
              </div>
            ) : (
              <span />
            )}
            {lastSavedAt && (
              <span className="text-xs text-muted-foreground">
                Última vez actualizado a las{' '}
                {lastSavedAt.toLocaleTimeString('es-DO', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>
        </div>

        {/* Side: alt text + tips */}
        <div className="space-y-4">
          <InputField
            name="storeLogoAlt"
            label="Texto alternativo (alt)"
            placeholder="Anroy logo"
            defaultValue={storeLogoAlt || ''}
            helperText="Lo que leen los lectores de pantalla y Google. Se guarda solo al salir del campo."
            onBlur={handleAltBlur}
          />

          <div className="rounded-lg bg-muted/40 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recomendaciones
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside marker:text-primary">
              <li>PNG o SVG con fondo transparente</li>
              <li>Proporción horizontal (aspecto 3:1 a 4:1)</li>
              <li>Mínimo 240×80 px para verse nítido</li>
              <li>Peso bajo 200 KB para que cargue rápido</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FileBrowser in a proper modal — no more inline overflow */}
      <Dialog open={openBrowser} onOpenChange={setOpenBrowser}>
        <DialogContent className="max-w-5xl w-[95vw] h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b">
            <DialogTitle>Selecciona o sube tu logo</DialogTitle>
            <DialogDescription>
              Elige una imagen ya subida o sube una nueva. Se guardará en tu Firebase Storage.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <FileBrowser
              isMultiple={false}
              onInsert={handlePick}
              close={() => setOpenBrowser(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface StoreSettingProps {
  saveSettingApi: string;
  setting: {
    storeName: string;
    storeDescription: string;
    storePhoneNumber: string;
    storeEmail: string;
    storeCountry: string;
    storeAddress: string;
    storeCity: string;
    storeProvince: string;
    storePostalCode: string;
    storeLogo: string | null;
    storeLogoAlt: string | null;
    storeInstagram: string | null;
    storeFacebook: string | null;
    storeWhatsapp: string | null;
    storeTiktok: string | null;
    storeTwitter: string | null;
    helpLinkShipping: string | null;
    helpLinkReturns: string | null;
    helpLinkFaq: string | null;
    helpLinkContact: string | null;
    storeNotificationFrom: string | null;
  };
}

// Reusable inline-saving social input that mirrors the logo flow:
// type a URL, blur → guarda automáticamente con toast verde.
const SocialInput: React.FC<{
  name: string;
  label: string;
  placeholder: string;
  defaultValue: string | null;
  saveApi: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}> = ({ name, label, placeholder, defaultValue, saveApi, Icon }) => {
  const [value, setValue] = React.useState<string>(defaultValue || '');
  const [state, setState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  );
  const debounce = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = async (newVal: string) => {
    setState('saving');
    try {
      const res = await axios.post(saveApi, { [name]: newVal || '' }, {
        validateStatus: () => true
      });
      if (res.status >= 200 && res.status < 300) {
        setState('saved');
        toast.success(`${label} guardado`);
        setTimeout(() => setState('idle'), 2000);
      } else {
        setState('error');
        toast.error(res.data?.error?.message || 'No se pudo guardar');
      }
    } catch (e: any) {
      setState('error');
      toast.error(e?.message || 'Error de conexión');
    }
  };

  const handleBlur = () => {
    if (value === (defaultValue || '')) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => save(value), 200);
  };

  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      <div
        className={`flex items-center gap-2 rounded-md border bg-background transition-colors ${
          state === 'saved'
            ? 'border-emerald-500'
            : state === 'error'
            ? 'border-destructive'
            : 'border-input focus-within:border-primary'
        }`}
      >
        <div className="pl-3 text-muted-foreground">
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none py-2 pr-2 text-sm"
        />
        <div className="pr-3 text-xs">
          {state === 'saving' && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {state === 'saved' && <Check className="w-4 h-4 text-emerald-600" />}
        </div>
      </div>
    </div>
  );
};

export default function StoreSetting({
  saveSettingApi,
  setting: {
    storeName,
    storeDescription,
    storePhoneNumber,
    storeEmail,
    storeCountry,
    storeAddress,
    storeCity,
    storeProvince,
    storePostalCode,
    storeLogo,
    storeLogoAlt,
    storeInstagram,
    storeFacebook,
    storeWhatsapp,
    storeTiktok,
    storeTwitter,
    helpLinkShipping,
    helpLinkReturns,
    helpLinkFaq,
    helpLinkContact,
    storeNotificationFrom
  }
}: StoreSettingProps) {
  const [selectedCountry, setSelectedCountry] = React.useState(() => {
    const country = storeCountry;
    if (!country) {
      return 'US';
    } else {
      return country;
    }
  });

  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-5 grid-flow-row ">
        <div className="col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-4">
          <Form method="POST" id="storeSetting" action={saveSettingApi}>
            <Card>
              <CardHeader>
                <CardTitle>Configuración de tienda</CardTitle>
                <CardDescription>
                  Configura la información de tu tienda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Area
                  id="storeInfoSetting"
                  className="space-y-3"
                  coreComponents={[
                    {
                      component: {
                        default: (
                          <InputField
                            name="storeName"
                            label="Nombre de la tienda"
                            required
                            placeholder="Nombre de la tienda"
                            defaultValue={storeName}
                          />
                        )
                      },
                      sortOrder: 10
                    },
                    {
                      component: {
                        default: (
                          <TextareaField
                            name="storeDescription"
                            label="Descripción de la tienda"
                            placeholder="Descripción de la tienda"
                            defaultValue={storeDescription}
                            required
                          />
                        )
                      },
                      sortOrder: 20
                    }
                  ]}
                />
              </CardContent>
              <CardContent className="pt-5 border-t border-border">
                <div className="space-y-1 mb-5">
                  <CardTitle>Logo de la marca</CardTitle>
                  <CardDescription>
                    Se guarda automáticamente al subir o quitar — no necesitas
                    presionar guardar abajo.
                  </CardDescription>
                </div>
                <StoreLogo
                  storeLogo={storeLogo}
                  storeLogoAlt={storeLogoAlt}
                  saveApi={saveSettingApi}
                />
              </CardContent>
              <CardContent className="pt-5 border-t border-border">
                <div className="space-y-1 mb-5">
                  <CardTitle>Redes sociales</CardTitle>
                  <CardDescription>
                    Aparecen en el footer de la tienda. Deja un campo vacío
                    si no usas esa red — el ícono se oculta solo.
                  </CardDescription>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SocialInput
                    name="storeInstagram"
                    label="Instagram"
                    placeholder="https://instagram.com/tu-tienda"
                    defaultValue={storeInstagram}
                    saveApi={saveSettingApi}
                    Icon={Instagram}
                  />
                  <SocialInput
                    name="storeFacebook"
                    label="Facebook"
                    placeholder="https://facebook.com/tu-tienda"
                    defaultValue={storeFacebook}
                    saveApi={saveSettingApi}
                    Icon={Facebook}
                  />
                  <SocialInput
                    name="storeWhatsapp"
                    label="WhatsApp"
                    placeholder="https://wa.me/18095555555"
                    defaultValue={storeWhatsapp}
                    saveApi={saveSettingApi}
                    Icon={MessageCircle}
                  />
                  <SocialInput
                    name="storeTiktok"
                    label="TikTok"
                    placeholder="https://tiktok.com/@tu-tienda"
                    defaultValue={storeTiktok}
                    saveApi={saveSettingApi}
                    Icon={Music2}
                  />
                  <SocialInput
                    name="storeTwitter"
                    label="X / Twitter"
                    placeholder="https://x.com/tu-tienda"
                    defaultValue={storeTwitter}
                    saveApi={saveSettingApi}
                    Icon={Twitter}
                  />
                </div>
              </CardContent>
              <CardContent className="pt-5 border-t border-border">
                <div className="space-y-1 mb-5">
                  <CardTitle>Links de ayuda (footer)</CardTitle>
                  <CardDescription>
                    URLs de las páginas que aparecen en la sección &ldquo;Ayuda&rdquo; del footer.
                    Deja un campo vacío si no usas ese link — se oculta solo.
                  </CardDescription>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SocialInput
                    name="helpLinkShipping"
                    label="Envíos y entregas"
                    placeholder="/cms/envios"
                    defaultValue={helpLinkShipping}
                    saveApi={saveSettingApi}
                    Icon={Truck}
                  />
                  <SocialInput
                    name="helpLinkReturns"
                    label="Devoluciones"
                    placeholder="/cms/devoluciones"
                    defaultValue={helpLinkReturns}
                    saveApi={saveSettingApi}
                    Icon={RotateCcw}
                  />
                  <SocialInput
                    name="helpLinkFaq"
                    label="Preguntas frecuentes"
                    placeholder="/cms/faq"
                    defaultValue={helpLinkFaq}
                    saveApi={saveSettingApi}
                    Icon={HelpCircle}
                  />
                  <SocialInput
                    name="helpLinkContact"
                    label="Contáctanos"
                    placeholder="/cms/contacto"
                    defaultValue={helpLinkContact}
                    saveApi={saveSettingApi}
                    Icon={MessageCircle}
                  />
                </div>
              </CardContent>
              <CardContent className="pt-5 border-t border-border">
                <div className="space-y-1 mb-5">
                  <CardTitle>Correos de notificación</CardTitle>
                  <CardDescription>
                    Dirección desde la que se envían los correos automáticos
                    (confirmaciones de pedido, reseteo de contraseña, etc.).
                  </CardDescription>
                </div>
                <SocialInput
                  name="storeNotificationFrom"
                  label="Remitente (From)"
                  placeholder="hola@anroy.do"
                  defaultValue={storeNotificationFrom}
                  saveApi={saveSettingApi}
                  Icon={AtSign}
                />
              </CardContent>
              <CardContent className="pt-3 border-t border-border">
                <CardTitle>Información de contacto</CardTitle>
                <Area
                  id="storeContactSetting"
                  coreComponents={[
                    {
                      component: {
                        default: StorePhoneNumber
                      },
                      props: {
                        storePhoneNumber
                      },
                      sortOrder: 10
                    },
                    {
                      component: {
                        default: StoreEmail
                      },
                      props: {
                        storeEmail
                      },
                      sortOrder: 20
                    }
                  ]}
                  className="grid grid-cols-2 gap-5 mt-5"
                />
              </CardContent>
              <CardContent className="pt-3 border-t border-border">
                <CardTitle>Dirección</CardTitle>
                <div className="space-y-3">
                  <Country
                    selectedCountry={storeCountry}
                    setSelectedCountry={setSelectedCountry}
                  />
                  <InputField
                    name="storeAddress"
                    label="Dirección"
                    defaultValue={storeAddress}
                    placeholder="Dirección de la tienda"
                  />
                </div>
                <div className="grid grid-cols-3 gap-5 mt-5">
                  <div>
                    <InputField
                      name="storeCity"
                      label="Ciudad"
                      defaultValue={storeCity}
                      placeholder="Ciudad"
                    />
                  </div>
                  <Province
                    selectedProvince={storeProvince}
                    selectedCountry={selectedCountry}
                  />
                  <div>
                    <InputField
                      name="storePostalCode"
                      label="Código postal"
                      defaultValue={storePostalCode}
                      placeholder="Código postal"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Form>
        </div>
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query Query {
    saveSettingApi: url(routeId: "saveSetting")
    setting {
      storeName
      storeDescription
      storeTimeZone
      storePhoneNumber
      storeEmail
      storeCountry
      storeAddress
      storeCity
      storeProvince
      storePostalCode
      storeLogo
      storeLogoAlt
      storeInstagram
      storeFacebook
      storeWhatsapp
      storeTiktok
      storeTwitter
      helpLinkShipping
      helpLinkReturns
      helpLinkFaq
      helpLinkContact
      storeNotificationFrom
    }
  }
`;
