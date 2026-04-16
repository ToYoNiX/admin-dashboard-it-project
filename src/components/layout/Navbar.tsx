import React from 'react';
import {
  SearchIcon,
  BellIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  GlobeIcon } from
'lucide-react';
interface NavbarProps {
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}
export function Navbar({
  onToggleSidebar,
  darkMode,
  onToggleDarkMode
}: NavbarProps) {
  return (
    <header className="h-16 bg-[#0D1B3E] text-white sticky top-0 z-50 flex items-center justify-between px-4 shadow-md">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors md:hidden"
          aria-label="Toggle Sidebar">

          <MenuIcon className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 cursor-pointer">
          <div className="flex items-center justify-center">
            <img src="/assists/must_logo.png" alt="MISR UNIVERSITY Logo" className="h-10 w-auto object-contain" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-wide leading-tight">
              MISR UNIVERSITY
            </h1>
            <p className="text-[10px] text-gray-300 tracking-wider">
              FOR SCIENCE & TECHNOLOGY
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-white/10 rounded-full px-3 py-1.5 cursor-pointer hover:bg-white/20 transition-colors">
          <GlobeIcon className="w-3.5 h-3.5 text-teal-300" />
          <span className="text-white">EN</span>
          <span className="text-gray-400 mx-0.5">|</span>
          <span className="text-gray-400 hover:text-white">AR</span>
        </div>

        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <SearchIcon className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleDarkMode}
          className="p-2 hover:bg-white/10 rounded-full transition-colors">

          {darkMode ?
          <SunIcon className="w-5 h-5" /> :

          <MoonIcon className="w-5 h-5" />
          }
        </button>

        <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0D1B3E]"></span>
        </button>

        <div className="w-9 h-9 rounded-full bg-must-green flex items-center justify-center text-sm font-bold border-2 border-white/20 cursor-pointer ml-1">
          AD
        </div>
      </div>
    </header>);

}