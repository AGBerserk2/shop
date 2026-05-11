import Spinner from '@components/admin/Spinner.jsx';
import { InputField } from '@components/common/form/InputField.js';
import { RadioGroupField } from '@components/common/form/RadioGroupField.js';
import { Button } from '@components/common/ui/Button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Input } from '@components/common/ui/Input.js';
import {
  InputGroupAddon,
  InputGroupInput
} from '@components/common/ui/InputGroup.js';
import { InputGroup } from '@components/common/ui/InputGroup.js';
import { PlusCircle } from 'lucide-react';
import React from 'react';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import Select from 'react-select';
import { useQuery } from 'urql';
import { v4 as uuidv4 } from 'uuid';
import { get } from '../../../../../lib/util/get.js';
import './General.scss';

const GroupsQuery = `
  query Query {
    attributeGroups {
      items {
        value: attributeGroupId
        label: groupName
      }
    }
  }
`;
interface Group {
  value: string;
  label: string;
  attributes: {
    items: {
      attributeId: string;
      attributeName: string;
      attributeCode: string;
      type: string;
      isRequired: number;
      options: {
        optionId: string;
        optionText: string;
      }[];
    }[];
  };
}

const Groups: React.FC<{ groups: Group[]; createGroupApi: string }> = ({
  groups,
  createGroupApi
}) => {
  const [result, reexecuteQuery] = useQuery({
    query: GroupsQuery
  });
  const { control } = useFormContext();
  const newGroup = React.useRef<HTMLInputElement | null>(null);
  const [createGroupError, setCreateGroupError] = React.useState<string | null>(
    null
  );
  const { data, fetching, error } = result;

  const createGroup = () => {
    if (!newGroup.current?.value) {
      setCreateGroupError('Group name is required');
      return;
    }
    fetch(createGroupApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ group_name: newGroup.current.value })
    })
      .then((response) => response.json())
      .then((jsonData) => {
        if (!jsonData.error) {
          newGroup.current!.value = '';
          setCreateGroupError(null);
          reexecuteQuery({ requestPolicy: 'network-only' });
        } else {
          setCreateGroupError(jsonData.error.message);
        }
      });
  };

  if (fetching)
    return (
      <div>
        <Spinner width={20} height={20} />
      </div>
    );
  if (error) {
    return <p className="text-destructive">{error.message}</p>;
  }

  return (
    <div>
      <div className="mb-2">Seleccionar grupos a los que pertenece el atributo</div>
      <div className="grid gap-5 grid-cols-2">
        <div>
          <Controller
            name="groups"
            control={control}
            defaultValue={groups.map((group) => group.value)}
            render={({ field }) => (
              <Select
                {...field}
                options={data.attributeGroups.items}
                hideSelectedOptions
                isMulti
                onChange={(selectedOptions) => {
                  field.onChange(
                    selectedOptions.map((option) => option.value) || []
                  );
                }}
                value={data.attributeGroups.items.filter((item) =>
                  field.value.includes(item.value)
                )}
              />
            )}
          />
        </div>
        <div className="grid gap-5 grid-cols-1">
          <div>
            <div className="flex gap-5">
              <InputGroup className="max-w-xs">
                <InputGroupInput
                  type="text"
                  placeholder="Create a new group"
                  ref={newGroup}
                />
                <InputGroupAddon align="inline-end">
                  <a
                    className="flex w-8 items-center justify-center text-primary"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      createGroup();
                    }}
                  >
                    <PlusCircle className="size-4" />
                  </a>
                </InputGroupAddon>
              </InputGroup>
            </div>
            {createGroupError && (
              <p className="text-destructive text-xs mt-1">
                {createGroupError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Options: React.FC<{
  originOptions?: Array<{ optionId: string; optionText: string; uuid: string }>;
}> = ({ originOptions = [] }) => {
  const { control } = useFormContext();
  const { fields, append, remove, replace } = useFieldArray({
    name: 'options',
    control
  });

  React.useEffect(() => {
    replace(
      originOptions.map((option) => ({
        option_text: option.optionText,
        option_id: option.optionId,
        uuid: option.uuid
      }))
    );
  }, []);

  const addOption = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    append({
      option_text: '',
      option_id: (
        Math.floor(Math.random() * (9000000 - 1000000)) + 1000000
      ).toString(),
      uuid: uuidv4()
    });
  };

  return (
    <div className="attribute-edit-options">
      {fields.map((field, index) => {
        return (
          <div key={field.id} className="flex items-center mb-2 space-x-5">
            <div className="flex-1">
              <InputField
                name={`options.${index}.option_text`}
                placeholder="Option text"
                validation={{ required: 'Option text is required' }}
              />
              <InputField type="hidden" name={`options.${index}.option_id`} />
            </div>
            <div className="self-center">
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  remove(index);
                }}
                variant={'destructive'}
              >
                Remove
              </Button>
            </div>
          </div>
        );
      })}
      <div className="mt-2">
        <Button type="button" onClick={addOption} variant={'outline'}>
          Add option
        </Button>
      </div>
    </div>
  );
};

interface GeneralProps {
  attribute?: {
    type?: string;
    attributeId?: string;
    attributeName?: string;
    attributeCode?: string;
    options?: {
      optionId: string;
      uuid: string;
      optionText: string;
    }[];
    groups?: {
      items: {
        value: string;
        label: string;
      }[];
    };
  };
  createGroupApi: string;
}

export default function General({ attribute, createGroupApi }: GeneralProps) {
  const [type] = React.useState(attribute?.type || 'text');

  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>
          Manage the general information of the attribute.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <InputField
            name="attribute_name"
            label="Nombre"
            placeholder="Enter attribute name"
            required
            defaultValue={attribute?.attributeName}
            validation={{ required: 'Attribute name is required' }}
          />

          <InputField
            name="attribute_code"
            label="Código"
            placeholder="Enter attribute code"
            required
            defaultValue={attribute?.attributeCode}
            validation={{ required: 'Attribute code is required' }}
            helperText="Attribute code is used in API and must be unique"
          />

          <div>
            <div className="space-y-2">
              <RadioGroupField
                name="type"
                options={[
                  { label: 'Text', value: 'text' },
                  { label: 'Select', value: 'select' },
                  { label: 'Multiselect', value: 'multiselect' },
                  { label: 'Textarea', value: 'textarea' }
                ]}
                label="Tipo"
                defaultValue={attribute?.type}
                required
                disabled={!!attribute?.attributeId}
                validation={{ required: 'Type is required' }}
              />
            </div>
          </div>
        </div>
      </CardContent>
      {['select', 'multiselect'].includes(type) && (
        <CardContent title="Attribute options">
          <Options originOptions={get(attribute, 'options', [])} />
        </CardContent>
      )}
      <CardContent title="Attribute Group">
        <Groups
          groups={get(attribute, 'groups.items', [])}
          createGroupApi={createGroupApi}
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
    attribute(id: getContextValue("attributeId", null)) {
      attributeId
      attributeName
      attributeCode
      type
      options {
        optionId: attributeOptionId
        uuid
        optionText
      }
      groups {
        items {
          value: attributeGroupId
          label: groupName
        }
      }
    }
    createGroupApi: url(routeId: "createAttributeGroup")
  }
`;
