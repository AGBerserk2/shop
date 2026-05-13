import Area from '@components/common/Area';
import { Card } from '@components/common/ui/Card';
import {
  CardContent,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import { Circle } from '@components/common/ui/Circle.js';
import { Table, TableBody, TableRow } from '@components/common/ui/Table.js';
import PropTypes from 'prop-types';
import React from 'react';
import { Name } from './items/Name.js';
import { Price } from './items/Price.js';
import { Thumbnail } from './items/Thumbnail.js';

export default function Items({ order: { items, shipmentStatus } }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex space-x-2">
            <Circle variant={shipmentStatus.badge || 'new'} />
            <span className="block self-center">
              {shipmentStatus.name || 'Desconocido'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table className="table-fixed">
          <TableBody>
            {items.map((i, k) => (
              <TableRow key={k}>
                <Area
                  key={k}
                  id={`order_item_row_${i.id}`}
                  noOuter
                  item={i}
                  coreComponents={[
                    {
                      component: { default: Thumbnail },
                      props: { imageUrl: i.thumbnail, qty: i.qty },
                      sortOrder: 10,
                      id: 'productThumbnail'
                    },
                    {
                      component: { default: Name },
                      props: {
                        name: i.productName,
                        productSku: i.productSku,
                        productUrl: i.productUrl,
                        variantOptions: i.variantOptions
                      }, // TODO: Implement custom options
                      sortOrder: 20,
                      id: 'productName'
                    },
                    {
                      component: { default: Price },
                      props: { price: i.productPrice.text, qty: i.qty },
                      sortOrder: 30,
                      id: 'price'
                    },
                    {
                      component: { default: 'td' },
                      props: {
                        children: <span>{i.lineTotal.text}</span>,
                        key: 'lineTotal',
                        className: 'w-20 whitespace-nowrap text-right'
                      },
                      sortOrder: 40,
                      id: 'lineTotal'
                    }
                  ]}
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardContent>
        <div className="flex justify-end gap-2">
          <Area id="order_actions" noOuter />
        </div>
      </CardContent>
    </Card>
  );
}

Items.propTypes = {
  order: PropTypes.shape({
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        qty: PropTypes.number,
        productName: PropTypes.string,
        productSku: PropTypes.string,
        productUrl: PropTypes.string,
        thumbnail: PropTypes.string,
        productPrice: PropTypes.shape({
          value: PropTypes.number,
          text: PropTypes.string
        }),
        variantOptions: PropTypes.string,
        finalPrice: PropTypes.shape({
          value: PropTypes.number,
          text: PropTypes.string
        }),
        total: PropTypes.shape({
          value: PropTypes.number,
          text: PropTypes.string
        }),
        lineTotal: PropTypes.shape({
          value: PropTypes.number,
          text: PropTypes.string
        })
      })
    ),
    shipmentStatus: PropTypes.shape({
      code: PropTypes.string,
      badge: PropTypes.string,
      name: PropTypes.string
    }),
    shipment: PropTypes.shape({
      shipmentId: PropTypes.string,
      carrier: PropTypes.string,
      trackingNumber: PropTypes.string,
      updateShipmentApi: PropTypes.string
    }),
    createShipmentApi: PropTypes.string.isRequired
  }).isRequired
};

export const layout = {
  areaId: 'leftSide',
  sortOrder: 10
};

export const query = `
  query Query {
    order(uuid: getContextValue("orderId")) {
      currency
      shipment {
        shipmentId
        carrier
        trackingNumber
        updateShipmentApi
      }
      shipmentStatus {
        code
        badge
        name
      }
      items {
        id: orderItemId
        qty
        productName
        productSku
        productUrl
        thumbnail
        variantOptions {
          attributeCode
          attributeName
          attributeId
          optionId
          optionText
        }
        productPrice {
          value
          text
        }
        finalPrice {
          value
          text
        }
        total {
          value
          text
        }
        lineTotal {
          value
          text
        }
      }
      createShipmentApi
    },
    carriers {
      label: name
      value: code
    }
  }
`;
