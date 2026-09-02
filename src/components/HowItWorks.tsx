import { FileText, Target, LayoutDashboard } from "lucide-react";

const STEPS = [
  {
    icon: FileText,
    title: "1. Cuéntanos tu perfil",
    description:
      "Comparte tus proyectos, prácticas profesionales, habilidades y educación en un formulario guiado de 2 minutos.",
  },
  {
    icon: Target,
    title: "2. Pega la vacante objetivo",
    description:
      "Copia la descripción del puesto que te interesa. Nuestro motor la analiza como lo haría un sistema ATS real.",
  },
  {
    icon: LayoutDashboard,
    title: "3. Recibe tu diagnóstico",
    description:
      "Obtén tu porcentaje de match, fortalezas, brechas a mejorar y una vista previa de tu CV optimizado.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold text-navy md:text-4xl">
          Cómo funciona
        </h2>
        <p className="mt-4 text-muted">
          Tres pasos simples para pasar de tu perfil a un CV que los
          reclutadores y los sistemas ATS realmente ven.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, description }, i) => (
          <div
            key={title}
            className="card-shadow relative rounded-2xl border border-border bg-surface p-8"
          >
            <span className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
              {i + 1}
            </span>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan/10 text-cyan">
              <Icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-navy">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
