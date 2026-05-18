import { CategorySelector } from '@components/admin/CategorySelector.js';
import Area from '@components/common/Area.js';
import { Editor } from '@components/common/form/Editor.js';
import { InputField } from '@components/common/form/InputField.js';
import { NumberField } from '@components/common/form/NumberField.js';
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
  DialogTitle
} from '@components/common/ui/Dialog.js';
import { Label } from '@components/common/ui/Label.js';
import { _ } from '@evershop/evershop/lib/locale/translate/_';
import React from 'react';
import { useQuery } from 'urql';
import './General.scss';
import { useFormContext } from 'react-hook-form';

const SKUAndPrice: React.FC<{
  sku: string;
  price: {
    value: number | undefined;
  };
  setting: {
    storeCurrency: string;
    weightUnit: string;
  };
}> = ({ sku, price, setting }) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <InputField
        name="sku"
        label="SKU"
        placeholder="Ingresá el SKU"
        defaultValue={sku}
        required
        helperText={_('El SKU debe ser único')}
      />
      <NumberField
        name="price"
        placeholder="Ingresá el precio"
        label={`Precio`}
        defaultValue={price?.value}
        unit={setting.storeCurrency}
        min={0}
        required
      />
    </div>
  );
};

const CategoryQuery = `
  query Query ($id: Int!) {
    category(id: $id) {
      categoryId
      name
      path {
        name
      }
    }
  }
`;

const ProductCategory: React.FC<{
  categoryId: number;
  onChange: () => void;
  onUnassign: () => void;
}> = ({ categoryId, onChange, onUnassign }) => {
  const { register } = useFormContext();
  const [result] = useQuery({
    query: CategoryQuery,
    variables: {
      id: categoryId
    }
  });
  const { data, fetching, error } = result;
  if (error) {
    return (
      <p className="text-destructive">
        Ocurrió un error al cargar las categorías.
        {error.message}
      </p>
    );
  }
  if (fetching) {
    return <span>Cargando...</span>;
  }
  return (
    <div>
      {data.category.path.map((item, index) => (
        <span key={item.name} className="text-gray-500">
          {item.name}
          {index < data.category.path.length - 1 && ' > '}
        </span>
      ))}
      <span className="text-interactive pl-5">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onChange();
          }}
        >
          Cambiar
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onUnassign();
          }}
          className="text-destructive ml-5"
        >
          Quitar
        </a>
      </span>
      <input type="hidden" {...register('category_id')} value={categoryId} />
    </div>
  );
};

const CategorySelect: React.FC<{
  product?:
    | {
        category?: {
          categoryId: number;
          name?: string;
          path?: Array<{ name: string }>;
        };
      }
    | undefined;
}> = ({ product }) => {
  const { setValue } = useFormContext();
  const [category, setCategory] = React.useState(
    product ? product.category : null
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const onSelect = (categoryId) => {
    setCategory({ categoryId });
    setValue('category_id', categoryId || '');
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <div className="space-y-3">
        <Label>Categoría</Label>
        {category && (
          <div className="border rounded border-border p-2">
            <ProductCategory
              categoryId={category.categoryId}
              onChange={() => {
                setDialogOpen(true);
              }}
              onUnassign={() => {
                setCategory(null);
                setValue('category_id', '');
              }}
            />
          </div>
        )}
        {!category && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              setDialogOpen(true);
            }}
          >
            Seleccionar categoría
          </Button>
        )}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar categoría</DialogTitle>
          </DialogHeader>
          <CategorySelector
            onSelect={onSelect}
            onUnSelect={() => {}}
            selectedCategories={category ? [category] : []}
          />
        </DialogContent>
      </div>
    </Dialog>
  );
};

interface GeneralProps {
  product?: {
    description?: Array<{
      id: string;
      size: number;
      columns: Array<{
        id: string;
        size: number;
        data: object;
      }>;
    }>;
    name: string;
    price: {
      regular: {
        currency: string;
        value: number;
      };
    };
    productId: number;
    uuid: string;
    taxClass: number;
    sku: string;
    weight: {
      unit: string;
      value: number;
    };
    category?: {
      categoryId: number;
      name?: string;
      path?: Array<{ name: string }>;
    };
  };
  setting: {
    storeCurrency: string;
    weightUnit: string;
  };
  productTaxClasses: {
    items: Array<{
      value: number;
      text: string;
    }>;
  };
}
export default function General({
  product,
  setting,
  productTaxClasses: { items: taxClasses }
}: GeneralProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Información general</CardTitle>
        <CardDescription>
          Gestiona la información general del producto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Area
          id="productEditGeneral"
          className="flex flex-col gap-2"
          coreComponents={[
            {
              component: {
                default: (
                  <InputField
                    name="name"
                    placeholder="Ingresá el nombre del producto"
                    label="Nombre del producto"
                    defaultValue={product?.name}
                    required
                    helperText={_('El nombre del producto es obligatorio')}
                  />
                )
              },
              sortOrder: 10,
              id: 'name'
            },
            {
              component: {
                default: (
                  <SKUAndPrice
                    sku={product?.sku || ''}
                    price={
                      product?.price.regular || {
                        value: undefined
                      }
                    }
                    setting={setting}
                  />
                )
              },
              sortOrder: 20,
              id: 'SKUAndPrice'
            },
            {
              component: {
                default: <CategorySelect product={product} />
              },
              sortOrder: 22,
              id: 'category'
            },
            {
              component: {
                default: (
                  <SelectField
                    name="tax_class"
                    label="Clase de impuesto"
                    options={taxClasses.map((taxClass) => ({
                      value: taxClass.value,
                      label: taxClass.text
                    }))}
                    defaultValue={product?.taxClass || ''}
                    required
                    validation={{ required: true }}
                  />
                )
              },
              sortOrder: 25,
              id: 'tax_class'
            },
            {
              component: {
                default: (
                  <Editor
                    name="description"
                    label="Descripción"
                    value={product?.description}
                  />
                )
              },
              sortOrder: 30,
              id: 'description'
            }
          ]}
        />
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'leftSide',
  sortOrder: 10
};

export const query = `
  query Query {
    product(id: getContextValue("productId", null)) {
      productId
      uuid
      name
      description
      sku
      taxClass
      price {
        regular {
          value
          currency
        }
      }
      weight {
        value
        unit
      }
      category {
        categoryId
        path {
          name
        }
      }
    }
    setting {
      weightUnit
      storeCurrency
    }
    productTaxClasses: taxClasses {
      items {
        value: taxClassId
        text: name
      }
    }
  }
`;
