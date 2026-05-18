export enum Operator {
  EQUAL = '=',
  NOT_EQUAL = '!=',
  GREATER = '>',
  GREATER_OR_EQUAL = '>=',
  SMALLER = '<',
  SMALLER_OR_EQUAL = '<=',
  IN = 'IN',
  NOT_IN = 'NOT IN'
}

export type ConditionKey = {
  key: string;
  label: string;
};

export type OperatorOption = {
  key: Operator;
  label: string;
};

const options: ConditionKey[] = [
  {
    key: 'category',
    label: 'Categoría'
  },
  {
    key: 'collection',
    label: 'Colección'
  },
  {
    key: 'attribute_group',
    label: 'Grupo de atributos'
  },
  {
    key: 'sku',
    label: 'SKU'
  },
  {
    key: 'price',
    label: 'Precio'
  }
];

const operators: OperatorOption[] = [
  {
    key: Operator.EQUAL,
    label: 'Igual'
  },
  {
    key: Operator.NOT_EQUAL,
    label: 'Distinto'
  },
  {
    key: Operator.GREATER,
    label: 'Mayor'
  },
  {
    key: Operator.GREATER_OR_EQUAL,
    label: 'Mayor o igual'
  },
  {
    key: Operator.SMALLER,
    label: 'Menor'
  },
  {
    key: Operator.SMALLER_OR_EQUAL,
    label: 'Menor o igual'
  },
  {
    key: Operator.IN,
    label: 'Está en'
  },
  {
    key: Operator.NOT_IN,
    label: 'No está en'
  }
];

export { options, operators };
