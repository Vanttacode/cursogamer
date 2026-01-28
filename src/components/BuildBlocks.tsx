import React from "react";

export default function BuildBlocks() {
  const blocks = [
    {
      n: "01",
      title: "Diseño del juego (Visual Hacking)",
      desc: "Arman la estética: colores, UI, assets, estilo “dev/gamer pro”. Que se vea increíble.",
      tag: "Look & Feel",
      accent: "var(--neon-purple)",
    },
    {
      n: "02",
      title: "Movimiento + colisiones",
      desc: "Programan controles y colisiones (lo esencial para que se sienta como juego real).",
      tag: "Gameplay",
      accent: "var(--neon-blue)",
    },
    {
      n: "03",
      title: "Score + dificultad",
      desc: "Puntaje, vidas y dificultad progresiva. Empieza fácil, termina pro.",
      tag: "Lógica",
      accent: "var(--neon-green)",
    },
    {
      n: "04",
      title: "Publicación con URL",
      desc: "Lo subimos a internet en un servidor real. Se van con el link listo para compartir.",
      tag: "Deploy",
      accent: "var(--neon-blue)",
    },
    {
      n: "05",
      title: "Proyecto + código editable",
      desc: "Se llevan el proyecto completo (código) para seguir modificándolo en casa.",
      tag: "Código",
      accent: "var(--neon-green)",
    },
    {
      n: "06",
      title: "Certificado digital",
      desc: "Certificado de participación digital como Programador/a (para guardar y compartir).",
      tag: "Certificación",
      accent: "var(--neon-purple)",
    },
  ];

  return (
    <div className="threeCol">
      {blocks.map((b) => (
        <div key={b.n} className="card" style={{ background: "rgba(10,15,28,.55)" }}>
          <div className="inner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div className="badge">
                <span className="mono" style={{ color: b.accent }}>{b.n}</span>
                <span>•</span>
                <span className="mono">{b.tag}</span>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{b.title}</div>
              <div className="small" style={{ marginTop: 8, lineHeight: 1.7 }}>
                {b.desc}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
