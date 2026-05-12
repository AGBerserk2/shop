import Area from '@components/common/Area';
import React from 'react';
import { DateRangeProvider } from './DateRange.js';
import './Layout.scss';

// All dashboard widgets that need the date range read it from a single
// context provided here, so the picker in KpiCards updates every chart
// consistently.
export default function DashboardLayout() {
  return (
    <DateRangeProvider>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 grid-flow-row">
        <div className="lg:col-span-2 grid grid-cols-1 gap-4 lg:gap-5 auto-rows-max min-w-0">
          <Area id="leftSide" noOuter />
        </div>
        <div className="lg:col-span-1 grid grid-cols-1 gap-4 lg:gap-5 auto-rows-max min-w-0">
          <Area id="rightSide" noOuter />
        </div>
      </div>
    </DateRangeProvider>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};
