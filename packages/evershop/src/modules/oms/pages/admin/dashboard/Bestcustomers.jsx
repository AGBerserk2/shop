import { useAppState } from '@components/common/context/app';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@components/common/ui/Card.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@components/common/ui/Table.js';
import PropTypes from 'prop-types';
import React from 'react';

export default function BestCustomers({ listUrl, setting }) {
  const context = useAppState();
  const customers = context.bestCustomers || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mejores clientes</CardTitle>
        <CardDescription>
          Lista de clientes que han hecho más pedidos
        </CardDescription>
        <CardAction>
          <a href={listUrl} className="text-sm text-primary hover:underline">
            Ver todos los clientes
          </a>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c, i) => {
              const grandTotal = new Intl.NumberFormat('en', {
                style: 'currency',
                currency: setting.storeCurrency
              }).format(c.total);
              return (
                <TableRow key={i}>
                  <TableCell>
                    <a href={c.editUrl || ''}>{c.full_name}</a>
                  </TableCell>
                  <TableCell>{c.orders}</TableCell>
                  <TableCell>{grandTotal}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

BestCustomers.propTypes = {
  setting: PropTypes.shape({
    storeCurrency: PropTypes.string
  }).isRequired,
  listUrl: PropTypes.string.isRequired
};

export const query = `
  query Query {
    setting {
      storeCurrency
    }
    listUrl: url(routeId: "productGrid")
  }
`;
