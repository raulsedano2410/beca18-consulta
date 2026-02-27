"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function CafeSticky() {
  const [yapeOpen, setYapeOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(!!sessionStorage.getItem("cafe-dismissed"));
  }, []);

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("cafe-dismissed", "1");
  };

  if (dismissed) return null;

  return (
    <>
      {/* Boton flotante esquina inferior derecha */}
      <div className="fixed bottom-5 right-4 z-40 flex items-center gap-1.5 animate-slide-down">
        <button
          onClick={dismiss}
          className="w-5 h-5 bg-gray-400/60 hover:bg-gray-500/80 dark:bg-gray-600/60 dark:hover:bg-gray-500/80 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={() => setYapeOpen(true)}
          className="w-12 h-12 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center transition-all cursor-pointer"
          aria-label="Invitame un cafe"
        >
          <span className="text-xl leading-none">&#9749;</span>
        </button>
      </div>

      {/* Modal Yape QR */}
      {yapeOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setYapeOpen(false)}
        >
          <div
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setYapeOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
              &#9749; Invitame un cafe
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Escanea el codigo QR con Yape
            </p>
            <div className="flex justify-center mb-3">
              <Image
                src="/yape-qr.jpg"
                alt="Codigo QR de Yape"
                width={250}
                height={250}
                className="rounded-xl"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Gracias por tu apoyo &#10084;&#65039;
            </p>
          </div>
        </div>
      )}
    </>
  );
}
