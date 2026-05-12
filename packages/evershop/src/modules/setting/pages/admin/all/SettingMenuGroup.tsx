import { NavigationItem } from '@components/admin/NavigationItem.js';
import { Settings } from 'lucide-react';
import React from 'react';

interface SettingMenuGroupProps {
  storeSetting: string;
}

export default function SettingMenuGroup({
  storeSetting
}: SettingMenuGroupProps) {
  return (
    <NavigationItem Icon={Settings} url={storeSetting} title="Configuración" />
  );
}

export const layout = {
  areaId: 'adminMenu',
  sortOrder: 500
};

export const query = `
  query Query {
    storeSetting: url(routeId:"storeSetting")
  }
`;
