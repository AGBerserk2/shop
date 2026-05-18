import { SettingMenu } from '@components/admin/SettingMenu.js';
import Spinner from '@components/admin/Spinner.js';
import { Form } from '@components/common/form/Form.js';
import { SelectField } from '@components/common/form/SelectField.js';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@components/common/ui/Dialog.js';
import React from 'react';
import { useQuery } from 'urql';
import { TaxClasses } from './components/TaxClasses.js';
import { TaxClassForm } from './components/TaxClassForm.js';

const CountriesQuery = `
  query Country($countries: [String]) {
    countries (countries: $countries) {
      value: code
      label: name
      provinces {
        value: code
        label: name
      }
    }
  }
`;

const TaxClassesQuery = `
  query TaxClasses {
    taxClasses {
      items {
        taxClassId
        uuid
        name
        rates {
          taxRateId
          uuid
          name
          rate
          isCompound
          country
          province
          postcode
          priority
          updateApi
          deleteApi
        }
        addRateApi
      }
    }
  }
`;

interface TaxSettingProps {
  createTaxClassApi: string;
  saveSettingApi: string;
  setting: {
    defaultProductTaxClassId?: number;
    defaultShippingTaxClassId?: number;
    baseCalculationAddress?: string;
  };
}
export default function TaxSetting({
  createTaxClassApi,
  saveSettingApi,
  setting
}: TaxSettingProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [countriesQueryData] = useQuery({
    query: CountriesQuery
  });

  const [taxClassesQueryData, reexecuteQuery] = useQuery({
    query: TaxClassesQuery
  });

  if (countriesQueryData.fetching || taxClassesQueryData.fetching) {
    return (
      <div className="main-content-inner">
        <div className="grid grid-cols-6 gap-x-5 grid-flow-row ">
          <div className="col-span-2">
            <SettingMenu />
          </div>
          <div className="col-span-4">
            <Card>
              <CardContent>
                <Spinner width={30} height={30} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content-inner">
      <div className="grid grid-cols-6 gap-x-5 grid-flow-row ">
        <div className="col-span-2">
          <SettingMenu />
        </div>
        <div className="col-span-4 grid grid-cols-1 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del cálculo de impuestos</CardTitle>
              <CardDescription>
                Configura las clases de impuesto que estarán disponibles para
                tus clientes al finalizar la compra.
              </CardDescription>
            </CardHeader>
            <CardContent title="Configuración básica">
              <Form
                id="taxBasicConfig"
                method="POST"
                action={saveSettingApi}
                successMessage="¡La configuración de impuestos se guardó correctamente!"
              >
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <SelectField
                      name="defaultShippingTaxClassId"
                      label="Clase de impuesto del envío"
                      defaultValue={setting.defaultShippingTaxClassId}
                      placeholder="Ninguno"
                      options={[
                        {
                          value: -1,
                          label:
                            'Asignación proporcional según los artículos del carrito'
                        },
                        {
                          value: 0,
                          label:
                            'Tasa de impuesto más alta según los artículos del carrito'
                        }
                      ].concat(
                        taxClassesQueryData.data.taxClasses.items.map(
                          (taxClass) => ({
                            value: taxClass.taxClassId,
                            label: taxClass.name
                          })
                        ) || []
                      )}
                      helperText="Esta es la clase de impuesto aplicada a los costos de envío."
                    />
                  </div>
                  <div>
                    <SelectField
                      name="baseCalculationAddress"
                      label="Dirección base de cálculo"
                      defaultValue={setting.baseCalculationAddress || ''}
                      options={[
                        {
                          value: 'shippingAddress',
                          label: 'Dirección de envío'
                        },
                        {
                          value: 'billingAddress',
                          label: 'Dirección de facturación'
                        },
                        {
                          value: 'storeAddress',
                          label: 'Dirección de la tienda'
                        }
                      ]}
                      helperText="Esta es la dirección utilizada para calcular las tasas de impuesto."
                    />
                  </div>
                </div>
              </Form>
            </CardContent>
          </Card>
          <Card title="Clases de impuesto">
            <CardHeader>
              <CardTitle>Clases de impuesto</CardTitle>
              <CardDescription>
                Administra las clases de impuesto y las tasas de impuesto para
                distintas regiones.
              </CardDescription>
            </CardHeader>
            <TaxClasses
              classes={taxClassesQueryData.data.taxClasses.items}
              getTaxClasses={reexecuteQuery}
            />
            <CardContent>
              <div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger>
                    <Button
                      title="Crear nueva clase de impuesto"
                      variant="outline"
                      onClick={() => setDialogOpen(true)}
                    >
                      Crear nueva clase de impuesto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear nueva clase de impuesto</DialogTitle>
                    </DialogHeader>
                    <TaxClassForm
                      saveTaxClassApi={createTaxClassApi}
                      closeModal={() => setDialogOpen(false)}
                      getTaxClasses={reexecuteQuery}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
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
    createTaxClassApi: url(routeId: "createTaxClass")
    saveSettingApi: url(routeId: "saveSetting")
    setting {
      defaultProductTaxClassId
      defaultShippingTaxClassId
      baseCalculationAddress
    }
  }
`;
