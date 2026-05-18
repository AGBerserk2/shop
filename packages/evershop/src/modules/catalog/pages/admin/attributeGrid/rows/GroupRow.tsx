import { Form } from '@components/common/form/Form.js';
import { InputField } from '@components/common/form/InputField.js';
import { useAlertContext } from '@components/common/modal/Alert.js';
import { Badge } from '@components/common/ui/Badge.js';
import { TableCell } from '@components/common/ui/Table.js';
import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

interface GroupRowProps {
  groups: Array<{
    attributeGroupId: string;
    updateApi: string;
    groupName: string;
  }>;
}
export function GroupRow({ groups }: GroupRowProps) {
  const form = useForm();
  const { openAlert, closeAlert, dispatchAlert } = useAlertContext();

  const onEdit = (group) => {
    openAlert({
      heading: `Editando ${group.groupName}`,
      content: (
        <div>
          <Form
            form={form}
            id="groupEdit"
            method="PATCH"
            action={group.updateApi}
            submitBtn={false}
            onSuccess={(response) => {
              if (response.error) {
                toast.error(response.error.message);
              } else {
                window.location.reload();
              }
            }}
          >
            <InputField
              name="group_name"
              required
              label="Nombre del grupo"
              placeholder="Ingresá el nombre del grupo"
              validation={{ required: 'El nombre del grupo es obligatorio' }}
              defaultValue={group.groupName}
            />
          </Form>
        </div>
      ),
      primaryAction: {
        title: 'Cancelar',
        onAction: closeAlert,
        variant: 'critical'
      },
      secondaryAction: {
        title: 'Guardar',
        onAction: () => {
          dispatchAlert({
            type: 'update',
            payload: {
              secondaryAction: { isLoading: form.formState.isSubmitting }
            }
          });
          (
            document.getElementById('groupEdit') as HTMLFormElement
          ).dispatchEvent(
            new Event('submit', { cancelable: true, bubbles: true })
          );
        },
        variant: 'secondary',
        isLoading: false
      }
    });
  };

  return (
    <TableCell>
      {groups.map((group) => (
        <div key={group.attributeGroupId}>
          <Badge variant={'secondary'}>
            <a
              href="#"
              className="hover:underline"
              onClick={(e) => {
                e.preventDefault();
                onEdit(group);
              }}
            >
              {group.groupName}
            </a>
          </Badge>
        </div>
      ))}
    </TableCell>
  );
}
