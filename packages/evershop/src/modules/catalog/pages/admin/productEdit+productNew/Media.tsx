import { ImageUploader } from '@components/admin/ImageUploader.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import React, { useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

interface MediaProps {
  product?: {
    image?: {
      uuid: string;
      path: string;
      url: string;
    };
    gallery?: {
      uuid: string;
      path: string;
      url: string;
    }[];
  };
}
export default function Media({ product }: MediaProps) {
  const control = useFormContext().control;
  const { fields, append, remove, replace } = useFieldArray({
    name: 'images',
    control
  }) as ReturnType<typeof useFieldArray>;
  useEffect(() => {
    const images = product?.image
      ? [product.image].concat(product?.gallery || [])
      : [];
    replace(images);
  }, []);
  return (
    <Card title="Media">
      <CardHeader>
        <CardTitle>Multimedia</CardTitle>
        <CardDescription>
          Gestiona las imágenes y la galería del producto. Arrastrá y soltá para
          reordenar las imágenes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ImageUploader
          currentImages={
            product?.image ? [product.image].concat(product?.gallery || []) : []
          }
          allowDelete={true}
          allowSwap={true}
          onDelete={(image) => {
            const index = fields.findIndex((img) => img.uuid === image.uuid);
            if (index !== -1) {
              remove(index);
            }
          }}
          onUpload={(images) => {
            append(images);
          }}
          onSortEnd={(oldIndex, newIndex) => {
            const newImages = [...fields];
            const [movedImage] = newImages.splice(oldIndex, 1);
            newImages.splice(newIndex, 0, movedImage);
            replace(newImages);
          }}
          targetPath={`catalog/${
            Math.floor(Math.random() * (9999 - 1000)) + 1000
          }/${Math.floor(Math.random() * (9999 - 1000)) + 1000}`}
        />
      </CardContent>
    </Card>
  );
}

export const layout = {
  areaId: 'leftSide',
  sortOrder: 15
};

export const query = `
  query Query {
    product(id: getContextValue("productId", null)) {
      image {
        uuid
        path
        url
      }
      gallery {
        uuid
        path
        url
      }
    }
  }
`;
