"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import StepIndicator from "@/components/wizard/StepIndicator";
import StepPerfil from "@/components/wizard/StepPerfil";
import StepVacante from "@/components/wizard/StepVacante";
import StepResultados from "@/components/wizard/StepResultados";
import { useDownloadCredits } from "@/lib/useDownloadCredits";
import type { MatchResult, PerfilEgresado } from "@/lib/types";

const PERFIL_INICIAL: PerfilEgresado = {
  nombre: "",
  email: "",
  telefono: "",
  ciudad: "",
  resumen: "",
  habilidades: [],
  educacion: [],
  experiencia: [],
  proyectos: "",
};

function PagoConfirmado() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addCredits } = useDownloadCredits();

  useEffect(() => {
    if (searchParams.get("pago") === "exitoso") {
      addCredits(10);
      router.replace("/analisis");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

export default function AnalisisPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [perfil, setPerfil] = useState<PerfilEgresado>(PERFIL_INICIAL);
  const [vacante, setVacante] = useState("");
  const [resultado, setResultado] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalizar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil, vacante }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo procesar el análisis.");
        return;
      }
      setResultado(data as MatchResult);
      setStep(3);
    } catch {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setStep(2);
    setVacante("");
    setResultado(null);
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Suspense fallback={null}>
        <PagoConfirmado />
      </Suspense>

      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-mint text-white">
              <Sparkles size={16} />
            </span>
            <span className="text-base font-bold text-navy">MatchCV</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-muted hover:text-navy">
            Volver al inicio
          </Link>
        </div>
      </header>

      <StepIndicator current={step} />

      <main className="flex-1 px-6 pb-20">
        {step === 1 && (
          <StepPerfil perfil={perfil} onChange={setPerfil} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <StepVacante
            vacante={vacante}
            onChange={setVacante}
            onBack={() => setStep(1)}
            onSubmit={handleAnalizar}
            loading={loading}
            error={error}
          />
        )}
        {step === 3 && resultado && (
          <StepResultados perfil={perfil} resultado={resultado} onRestart={handleRestart} />
        )}
      </main>
    </div>
  );
}
