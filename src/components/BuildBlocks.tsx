import React from "react";
import { motion } from "framer-motion";

type Block = {
  n: string;
  title: string;
  desc: string;
  tag: string;
  accent: "blue" | "purple" | "green" | "yellow";
};

const blocks: Block[] = [
  {
    n: "01",
    title: "Diseño y Creatividad (Su propia visión)",
    desc: "No usará plantillas aburridas. Tu hijo decidirá cómo se ve el héroe, los enemigos y el entorno. Verá sus ideas cobrar vida en la pantalla.",
    tag: "Arte & Diseño",
    accent: "purple",
  },
  {
    n: "02",
    title: "Control Total (La magia del código)",
    desc: "Dejará de apretar botones para escribir las reglas. Programará la gravedad, los saltos y las colisiones usando código real.",
    tag: "Lógica Pura",
    accent: "blue",
  },
  {
    n: "03",
    title: "El Desafío (Resolución de problemas)",
    desc: "Aprenderá a equilibrar la dificultad creando niveles y puntajes. Es gimnasia mental y matemáticas aplicadas, pero sin que se sienta como tarea.",
    tag: "Pensamiento Crítico",
    accent: "green",
  },
  {
    n: "04",
    title: "Lanzamiento Web (El gran logro)",
    desc: "El momento de la verdad: Publicamos su juego en internet. Tendrá un enlace real para enviarlo al grupo de la familia y decir: '¡Esto lo hice yo!'.",
    tag: "Autoestima",
    accent: "yellow",
  },
];

const deliverables = [
  {
    title: "El Código Fuente de su proyecto",
    desc: "Se lleva todo lo que construyó. Es una base real que puede seguir modificando en casa para practicar y mejorar.",
    accent: "green" as const,
  },
  {
    title: "Su Videojuego Online (URL Propia)",
    desc: "Un enlace público y perpetuo. Podrá mostrar su trabajo en cualquier celular o computador. Es su primer portafolio.",
    accent: "blue" as const,
  },
  {
    title: "Diploma Digital: Developer Junior",
    desc: "Certificado de finalización de Vantta Academy. Un reconocimiento formal a su esfuerzo y nueva habilidad desbloqueada.",
    accent: "purple" as const,
  },
  {
    title: "Kit de Recursos para el Futuro",
    desc: "Le entregamos una guía con los siguientes pasos, tutoriales recomendados y herramientas gratuitas para que no pare de aprender.",
    accent: "yellow" as const,
  },
  {
    title: "Inspiración Vocacional",
    desc: "Una experiencia inmersiva en Punta Arenas con herramientas de la industria. Puede ser la chispa que defina su futuro profesional.",
    accent: "green" as const,
  },
];

const accentClass: Record<string, string> = {
  blue: "from-blue-500/35 to-blue-500/0",
  purple: "from-purple-500/35 to-purple-500/0",
  green: "from-green-500/35 to-green-500/0",
  yellow: "from-yellow-400/35 to-yellow-400/0",
};

const dotClass: Record<string, string> = {
  blue: "bg-blue-400",
  purple: "bg-purple-400",
  green: "bg-green-400",
  yellow: "bg-yellow-300",
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function BuildBlocks() {
  return (
    <section aria-labelledby="build-title" className="relative">
      <div className="mx-auto max-w-5xl px-4">
        {/* Title */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          custom={0}
          variants={fadeUp}
          className="mb-10"
        >
          <h2 id="build-title" className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Mucho más que "jugar a la computadora"
          </h2>
          <p className="mt-3 text-jules-secondary text-base md:text-lg max-w-3xl">
            Este taller transforma el tiempo de pantalla en tiempo productivo.
            En solo dos días, pasarán de ser consumidores pasivos a <strong>creadores activos de tecnología</strong>.
          </p>
        </motion.div>

        {/* Blocks grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {blocks.map((b, i) => (
            <motion.article
              key={b.n}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              custom={i + 1}
              variants={fadeUp}
              className="relative"
            >
              {/* Outer technical frame */}
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-jules-panel/60 backdrop-blur-md">
                {/* Glow wash */}
                <div className={`pointer-events-none absolute -inset-6 bg-gradient-to-b ${accentClass[b.accent]} blur-2xl`} />

                {/* Pixel corners */}
                <div className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l border-t border-white/30" />
                <div className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r border-t border-white/30" />
                <div className="pointer-events-none absolute left-0 bottom-0 h-2 w-2 border-l border-b border-white/30" />
                <div className="pointer-events-none absolute right-0 bottom-0 h-2 w-2 border-r border-b border-white/30" />

                {/* Header strip */}
                <div className="relative flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dotClass[b.accent]}`} />
                    <span className="text-[11px] font-mono text-white/80">{b.tag}</span>
                  </div>
                  <span className="text-[11px] font-mono text-white/60">{b.n}</span>
                </div>

                {/* Content */}
                <div className="relative px-4 py-4">
                  <h3 className="text-white font-semibold text-base leading-snug">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-jules-secondary">{b.desc}</p>

                  {/* Subtle grid */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.06]"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                      backgroundSize: "28px 28px",
                    }}
                  />
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Deliverables block */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          custom={blocks.length + 2}
          variants={fadeUp}
          className="mt-10"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-jules-panel/55 backdrop-blur-md">
            <div className="pointer-events-none absolute -inset-10 bg-gradient-to-r from-blue-500/18 via-purple-500/12 to-green-500/18 blur-2xl" />

            <div className="px-5 md:px-7 py-6 border-b border-white/10">
              <h3 className="text-white text-xl md:text-2xl font-bold tracking-tight">
                ¿Qué se llevan a casa? (El Kit del Desarrollador)
              </h3>
              <p className="mt-2 text-sm md:text-base text-jules-secondary max-w-3xl">
                La experiencia no termina el martes. Los alumnos se van equipados con material tangible
                para seguir explorando este mundo por su cuenta.
              </p>
            </div>

            <div className="px-5 md:px-7 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliverables.map((d, idx) => (
                  <motion.div
                    key={d.title}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    custom={blocks.length + 3 + idx}
                    variants={fadeUp}
                    className="relative"
                  >
                    <div className="relative rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dotClass[d.accent]}`} />
                        <div>
                          <div className="text-white font-semibold">{d.title}</div>
                          <div className="mt-1 text-sm text-jules-secondary leading-relaxed">{d.desc}</div>
                        </div>
                      </div>

                      <div className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l border-t border-white/25" />
                      <div className="pointer-events-none absolute right-0 bottom-0 h-2 w-2 border-r border-b border-white/25" />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 text-[13px] md:text-sm text-jules-secondary">
                <span className="text-white font-semibold">Garantía de aprendizaje:</span> Usamos metodología práctica.
                Si tu hijo es curioso, este taller le dará las herramientas para entender el lenguaje del futuro.
              </div>
            </div>
          </div>
        </motion.div>

        {/* SEO helper (hidden, semantic) */}
        <div className="sr-only">
          Curso de programación de videojuegos para niños en Punta Arenas. Aprende React, JavaScript y desarrollo web creando un juego real.
          Taller de verano 2026 impartido por Nicolás Vera. Incluye certificado y publicación web.
        </div>
      </div>
    </section>
  );
}