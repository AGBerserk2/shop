import Spinner from '@components/admin/Spinner.js';
import { InputField } from '@components/common/form/InputField.js';
import { NumberField } from '@components/common/form/NumberField.js';
import { Input } from '@components/common/ui/Input.js';
import { Item, ItemContent } from '@components/common/ui/Item.js';
import { Label } from '@components/common/ui/Label.js';
import {
  RadioGroup,
  RadioGroupItem
} from '@components/common/ui/RadioGroup.js';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from 'urql';

const SearchQuery = `
  query Query ($filters: [FilterInput!]) {
    collections(filters: $filters) {
      items {
        collectionId
        uuid
        code
        name
      }
      total
    }
  }
`;

interface CollectionProductsSettingProps {
  collectionProductsWidget: {
    collection: string;
    count: number;
    countPerRow?: number;
  };
}
function CollectionProductsSetting({
  collectionProductsWidget: { collection, count, countPerRow }
}: CollectionProductsSettingProps) {
  const limit = 10;
  const [inputValue, setInputValue] = React.useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] =
    React.useState(collection);
  const [page, setPage] = React.useState(1);
  const { register, setValue } = useFormContext();
  const [result, reexecuteQuery] = useQuery({
    query: SearchQuery,
    variables: {
      filters: inputValue
        ? [
            { key: 'name', operation: 'like', value: inputValue },
            { key: 'page', operation: 'eq', value: page.toString() },
            { key: 'limit', operation: 'eq', value: limit.toString() }
          ]
        : [
            { key: 'limit', operation: 'eq', value: limit.toString() },
            { key: 'page', operation: 'eq', value: page.toString() }
          ]
    },
    pause: true
  });

  React.useEffect(() => {
    reexecuteQuery({ requestPolicy: 'network-only' });
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== null) {
        reexecuteQuery({ requestPolicy: 'network-only' });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  React.useEffect(() => {
    reexecuteQuery({ requestPolicy: 'network-only' });
  }, [page]);

  const { data, fetching, error } = result;

  if (error) {
    return (
      <p className="text-destructive">
        There was an error fetching collections.
        {error.message}
      </p>
    );
  }

  return (
    <div>
      <div>
        <div className="mb-3">
          <Input
            type="text"
            value={inputValue || ''}
            placeholder="Search collections"
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>
        {fetching && (
          <Item variant={'outline'}>
            <ItemContent>
              <Spinner width={25} height={25} />
            </ItemContent>
          </Item>
        )}
        {!fetching && data && (
          <div>
            {data.collections.items.length === 0 && (
              <div className="p-2 border border-divider rounded flex justify-center items-center">
                {inputValue ? (
                  <p>
                    No collections found for query &quot;{inputValue}&rdquo;
                  </p>
                ) : (
                  <p>No hay colecciones para mostrar</p>
                )}
              </div>
            )}
            <RadioGroup
              defaultValue={selectedCollection}
              onValueChange={(value) => {
                setSelectedCollection(value as string);
                setValue('settings[collection]', value, {
                  shouldDirty: true
                });
              }}
            >
              <div className="divide-y mb-2">
                {data.collections.items.map((collection) => (
                  <div
                    key={collection.uuid}
                    className="grid grid-cols-8 gap-5 py-3 border-divider items-center"
                  >
                    <div className="col-span-6">
                      <Label>{collection.name}</Label>
                    </div>
                    <div className="col-span-2 flex items-center justify-end">
                      <RadioGroupItem value={collection.code} />
                    </div>
                  </div>
                ))}
              </div>
              <InputField
                type="hidden"
                name="settings[collection]"
                required
                validation={{
                  required: 'Please select a collection'
                }}
                defaultValue={selectedCollection}
              />
            </RadioGroup>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-3">
        <NumberField
          name="settings[count]"
          label="Total products"
          defaultValue={count}
          required
          validation={{ min: 1, required: 'Count is required' }}
          min={1}
          placeholder="Number of products"
        />
        <div className="form-field">
          <NumberField
            name="settings[countPerRow]"
            label="Products per row"
            min={1}
            validation={{ min: 1, required: 'Count per row is required' }}
            required
            defaultValue={countPerRow}
            placeholder="Number of products per row"
          />
        </div>
      </div>
    </div>
  );
}

export default CollectionProductsSetting;

export const query = `
  query Query($collection: String, $count: Int, $countPerRow: Int) {
    collectionProductsWidget(collection: $collection, count: $count, countPerRow: $countPerRow) {
      collection
      count
      countPerRow
    }
  }
`;

export const variables = `{
  collection: getWidgetSetting("collection"),
  count: getWidgetSetting("count"),
  countPerRow: getWidgetSetting("countPerRow")
}`;
