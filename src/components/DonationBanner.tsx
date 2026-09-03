"use client";

import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import DonacionModal from "./DonacionModal";
import { CORREO_COMPROBANTES } from "@/lib/config";

export default function DonationBanner() {
  const [mostrarDonacion, setMostrarDonacion] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-6">
      <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-mint/20 bg-mint/5 px-8 py-7 md:flex-row">
        <div className="flex items-center gap-4 text-center md:text-left">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mint/15 text-mint sm:flex">
            <HeartHandshake size={24} />
          </span>
          <div>
            <h3 className="font-bold text-navy">
              ¿No cuentas con recursos económicos?
            </h3>
            <p className="mt-1 text-sm text-muted">
              Solicita una Beca Comunitaria y obtén tu paquete de descargas
              sin costo, o dona para ayudar a otro egresado a conseguir su
              primer empleo.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          <a
            href={`mailto:${CORREO_COMPROBANTES}?subject=Solicitud%20de%20Beca%20Comunitaria`}
            className="rounded-lg border border-mint px-5 py-2.5 text-sm font-semibold text-mint transition hover:bg-mint/10"
          >
            Solicitar beca
          </a>
          <button
            onClick={() => setMostrarDonacion(true)}
            className="rounded-lg bg-mint px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-mint-light"
          >
            Donar
          </button>
        </div>
      </div>

      {mostrarDonacion && <DonacionModal onClose={() => setMostrarDonacion(false)} />}
    </section>
  );
}
