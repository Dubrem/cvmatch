import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Daniela Ruiz",
    role: "Lic. en Mercadotecnia · Contratada en Grupo Bimbo",
    quote:
      "Pasé de no recibir respuestas a tener 3 entrevistas en dos semanas. El CV optimizado marcó la diferencia con los filtros ATS.",
  },
  {
    name: "Carlos Méndez",
    role: "Ing. en Sistemas · Contratado en Softtek",
    quote:
      "El reporte de match me mostró exactamente qué palabras clave me faltaban. Ajusté mi CV y por fin empecé a avanzar en los procesos.",
  },
  {
    name: "Ana Torres",
    role: "Lic. en Contaduría · Contratada en Deloitte",
    quote:
      "Usé la beca comunitaria porque no podía pagar el paquete. El equipo me ayudó y hoy tengo mi primer empleo formal.",
  },
];

export default function Testimonials() {
  return (
    <section id="casos-de-exito" className="mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold text-navy md:text-4xl">
          Casos de éxito
        </h2>
        <p className="mt-4 text-muted">
          Egresados reales que consiguieron su primer empleo optimizando su
          CV con nosotros.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="card-shadow flex flex-col rounded-2xl border border-border bg-surface p-7"
          >
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-navy-light">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-sm font-bold text-navy">{t.name}</p>
              <p className="text-xs text-muted">{t.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
