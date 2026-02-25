"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme, resolved } = useTheme();

  const links = [
    { href: "/", label: "Inicio", shortLabel: "Inicio" },
    { href: "/simulador", label: "Simulador", shortLabel: "Simulador" },
    { href: "/estadisticas", label: "Estadisticas", shortLabel: "Stats" },
    { href: "/ies", label: "IES", shortLabel: "IES" },
  ];

  function cycleTheme() {
    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
  }

  return (
    <nav className="bg-blue-800 dark:bg-gray-900 text-white shadow-lg sticky top-0 z-50 border-b border-blue-900 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
            <span className="hidden sm:inline">BECA 18</span>
            <span className="sm:hidden">B18</span>
            <span className="text-amber-300 text-sm font-normal">2026</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2 py-1 sm:px-3 sm:py-2 rounded text-sm transition-colors cursor-pointer ${
                    active
                      ? "bg-blue-600 dark:bg-gray-700"
                      : "hover:bg-blue-700 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="hidden sm:inline">{link.label}</span>
                  <span className="sm:hidden">{link.shortLabel}</span>
                </Link>
              );
            })}
            <button
              onClick={cycleTheme}
              className="ml-1 p-2 rounded-lg hover:bg-blue-700 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title={`Tema: ${theme === "system" ? "Sistema" : theme === "light" ? "Claro" : "Oscuro"}`}
              aria-label="Cambiar tema"
            >
              {theme === "system" ? (
                <MonitorIcon className="w-4 h-4" />
              ) : resolved === "dark" ? (
                <MoonIcon className="w-4 h-4" />
              ) : (
                <SunIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
