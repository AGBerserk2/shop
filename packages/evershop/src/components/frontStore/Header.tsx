import Area from '@components/common/Area.js';
import React from 'react';

export function Header() {
  return (
    <header className="header border-b border-gray-100">
      <Area id="headerTop" className="header__top" />
      <div className="header__middle max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-2 md:py-2 lg:py-3 flex items-center gap-4 md:gap-8">
        <Area
          id="headerMiddleLeft"
          className="header__middle__left flex justify-start items-center shrink-0"
        />
        <Area
          id="headerMiddleCenter"
          className="header__middle__center flex justify-center items-center flex-1 empty:hidden"
        />
        <Area
          id="headerMiddleRight"
          className="header__middle__right flex justify-end items-center gap-1 md:gap-2 ml-auto"
        />
      </div>
      <Area id="headerBottom" className="header__bottom" />
    </header>
  );
}
