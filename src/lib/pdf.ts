import jsPDF from "jspdf";
import type { MatchResult, PerfilEgresado } from "./types";

const MARGIN = 15;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function generarCvPdf(perfil: PerfilEgresado, resultado: MatchResult): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const addSpacing = (amount: number) => {
    y += amount;
    if (y > 280) {
      doc.addPage();
      y = MARGIN;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(perfil.nombre || "Nombre del candidato", MARGIN, y);
  addSpacing(7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const contactLine = [perfil.email, perfil.telefono, perfil.ciudad].filter(Boolean).join("  |  ");
  doc.text(contactLine, MARGIN, y);
  addSpacing(9);

  const sectionTitle = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(2, 132, 199);
    doc.text(title.toUpperCase(), MARGIN, y);
    addSpacing(1.5);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    addSpacing(6);
  };

  const bodyText = (text: string, size = 10.5) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    doc.text(lines, MARGIN, y);
    addSpacing(lines.length * 5 + 3);
  };

  sectionTitle("Resumen ejecutivo");
  bodyText(resultado.optimized_cv_content.resumen_ejecutivo);

  sectionTitle("Experiencia");
  resultado.optimized_cv_content.experiencia.forEach((exp) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(exp.titulo, MARGIN, y);
    addSpacing(5.5);
    exp.bullets.forEach((bullet) => {
      bodyText(`•  ${bullet}`, 10);
    });
    addSpacing(1);
  });

  sectionTitle("Habilidades destacadas");
  resultado.optimized_cv_content.habilidades_destacadas.forEach((h) => {
    bodyText(`•  ${h}`, 10.5);
  });

  sectionTitle("Educación");
  resultado.optimized_cv_content.educacion.forEach((edu) => {
    bodyText(edu, 10.5);
  });

  if (resultado.optimized_cv_content.idiomas.length > 0) {
    sectionTitle("Idiomas");
    resultado.optimized_cv_content.idiomas.forEach((idi) => {
      bodyText(`•  ${idi}`, 10.5);
    });
  }

  if (perfil.proyectos) {
    sectionTitle("Proyectos");
    bodyText(perfil.proyectos);
  }

  return doc;
}
