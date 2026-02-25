"use client";

import { useState } from "react";
import Image from "next/image";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function YapeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="12" fill="#6D28D9" />
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">Y</text>
    </svg>
  );
}

export function Footer() {
  const [yapeOpen, setYapeOpen] = useState(false);

  return (
    <>
      <footer className="bg-gray-800 dark:bg-gray-950 text-gray-300 py-8 mt-12 border-t border-gray-700 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Info */}
            <div className="text-center md:text-left">
              <p className="font-semibold text-white text-sm">Raul Sedano Molina</p>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                <a
                  href="mailto:raulsedanomolina@gmail.com"
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs cursor-pointer"
                >
                  <MailIcon className="w-3.5 h-3.5" />
                  raulsedanomolina@gmail.com
                </a>
                <a
                  href="https://github.com/raulsedano2410"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs cursor-pointer"
                >
                  <GitHubIcon className="w-3.5 h-3.5" />
                  GitHub
                </a>
              </div>
            </div>

            {/* Yape */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setYapeOpen(true)}
                className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                <YapeIcon className="w-5 h-5" />
                Invitame un cafe
              </button>
              <p className="text-gray-500 text-[10px]">Contribucion voluntaria via Yape</p>
            </div>

            {/* Legal */}
            <div className="text-center md:text-right text-xs text-gray-400 max-w-xs">
              <p>Datos de la RJ N° 509-2026-MINEDU/VMGI-PRONABEC-DIBEC</p>
              <p className="mt-1">
                Sitio informativo. Para resultados oficiales:{" "}
                <a
                  href="https://www.pronabec.gob.pe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline cursor-pointer"
                >
                  pronabec.gob.pe
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Yape QR Modal */}
      {yapeOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
          onClick={() => setYapeOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setYapeOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <YapeIcon className="w-8 h-8" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Yape</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Si esta herramienta te fue util, puedes apoyar con una contribucion voluntaria escaneando el QR.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-3">
                <Image
                  src="/yape-qr.jpg"
                  alt="QR de Yape"
                  width={250}
                  height={250}
                  className="mx-auto rounded-lg"
                />
              </div>
              <p className="text-xs text-gray-400">Escanea con la app de Yape</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
