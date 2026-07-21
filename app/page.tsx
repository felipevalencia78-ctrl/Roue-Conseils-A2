"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type Situation = {
  id: number;
  text: string;
};

const initialSituations: Situation[] = [
  { id: 1, text: "Tu as un ami qui dort mal." },
  { id: 2, text: "Ta sœur passe trop de temps sur TikTok." },
  { id: 3, text: "Ton camarade est stressé avant une présentation orale." },
  { id: 4, text: "Un étudiant veut apprendre le français plus rapidement." },
  { id: 5, text: "Une personne travaille trop et ne se repose jamais." },
  { id: 6, text: "Un ami arrive toujours en retard." },
  { id: 7, text: "Une personne mange mal et se sent fatiguée." },
  { id: 8, text: "Ton ami n’ose pas parler en classe." },
  { id: 9, text: "Une personne a trop de notifications sur son téléphone." },
  { id: 10, text: "Un étudiant oublie toujours ses affaires." },
];

const segmentColors = ["#d84a38", "#f2c94c", "#fffaf0", "#17324d"];

function normalizeDelta(value: number) {
  let delta = value;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

function createWheelGradient(count: number) {
  if (count === 0) return "#e9dcc2";
  const angle = 360 / count;
  const stops = Array.from({ length: count }, (_, index) => {
    const start = index * angle;
    const end = (index + 1) * angle;
    return `${segmentColors[index % segmentColors.length]} ${start}deg ${end}deg`;
  });
  return `conic-gradient(from ${-angle / 2}deg, ${stops.join(", ")})`;
}

export default function Home() {
  const wheelRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const lastPointerAngleRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const movedRef = useRef(false);
  const finishTimerRef = useRef<number | null>(null);

  const [activeSituations, setActiveSituations] = useState(initialSituations);
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [turns, setTurns] = useState(0);

  const segmentAngle = activeSituations.length > 0 ? 360 / activeSituations.length : 360;
  const selectedSituation = activeSituations.find((situation) => situation.id === selectedId) ?? null;

  const pointerAngle = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = wheelRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    return (Math.atan2(y, x) * 180) / Math.PI;
  };

  const revealSituation = (finalRotation: number, pool: Situation[]) => {
    const angle = 360 / pool.length;
    const localAngle = ((-finalRotation % 360) + 360) % 360;
    const index = Math.floor(((localAngle + angle / 2) % 360) / angle);
    setSelectedId(pool[index].id);
    setTurns((current) => current + 1);
    setSpinning(false);
  };

  const animateWheel = (direction = 1, velocity = 0) => {
    if (spinning || activeSituations.length === 0) return;
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);

    const pool = [...activeSituations];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const inertia = Math.min(Math.abs(velocity) * 1100, 1800);
    const extraRotation = 1080 + inertia + Math.random() * 360;
    const target = rotationRef.current + direction * extraRotation;

    rotationRef.current = target;
    setSelectedId(null);
    setSpinning(true);
    setDragging(false);
    setRotation(target);

    finishTimerRef.current = window.setTimeout(
      () => revealSituation(target, pool),
      reducedMotion ? 80 : 3250,
    );
  };

  const spinRandomly = () => {
    const direction = Math.random() > 0.18 ? 1 : -1;
    animateWheel(direction, 0.8 + Math.random() * 1.4);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (spinning || activeSituations.length === 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPointerAngleRef.current = pointerAngle(event);
    lastMoveTimeRef.current = performance.now();
    velocityRef.current = 0;
    movedRef.current = false;
    setSelectedId(null);
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging || spinning) return;

    const now = performance.now();
    const currentAngle = pointerAngle(event);
    const delta = normalizeDelta(currentAngle - lastPointerAngleRef.current);
    const elapsed = Math.max(now - lastMoveTimeRef.current, 1);

    if (Math.abs(delta) > 0.4) movedRef.current = true;
    rotationRef.current += delta;
    velocityRef.current = velocityRef.current * 0.65 + (delta / elapsed) * 0.35;
    lastPointerAngleRef.current = currentAngle;
    lastMoveTimeRef.current = now;
    setRotation(rotationRef.current);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging || spinning) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const direction = velocityRef.current === 0 ? 1 : Math.sign(velocityRef.current);
    animateWheel(direction, Math.abs(velocityRef.current));
  };

  const handleClick = () => {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    spinRandomly();
  };

  const removeSelected = () => {
    if (selectedId === null) return;
    setActiveSituations((current) => current.filter((situation) => situation.id !== selectedId));
    setSelectedId(null);
    rotationRef.current = 0;
    setRotation(0);
  };

  const resetWheel = () => {
    setActiveSituations(initialSituations);
    setSelectedId(null);
    rotationRef.current = 0;
    setRotation(0);
    setTurns(0);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#jeu" aria-label="La roue des conseils — accueil">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>La roue des conseils<small>Expression orale · Français A2</small></span>
        </a>
        <div className="top-meta">
          <span>{activeSituations.length} situation{activeSituations.length > 1 ? "s" : ""}</span>
          <span className="meta-dot" aria-hidden="true" />
          <span>{turns === 0 ? "Prêt à jouer" : `${turns} tirage${turns > 1 ? "s" : ""}`}</span>
        </div>
      </header>

      <section className="hero" id="jeu">
        <div className="intro">
          <h1>Fais tourner la roue.<br /><em>Donne un bon conseil.</em></h1>
          <p className="lead">Lis les situations sur la roue, fais-la tourner et propose deux conseils adaptés à la situation choisie.</p>
        </div>

        <div className="game-layout">
          <section className="wheel-zone" aria-labelledby="wheel-title">
            <h2 className="sr-only" id="wheel-title">Roue interactive des situations</h2>
            <div className="wheel-stage">
              <div className="pointer" aria-hidden="true"><span /></div>
              <button
                className={`wheel-button ${dragging ? "dragging" : ""}`}
                type="button"
                aria-label="Faire tourner la roue. Glissez avec la souris ou appuyez sur Entrée."
                aria-describedby="wheel-help"
                disabled={spinning || activeSituations.length === 0}
                onClick={handleClick}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => setDragging(false)}
              >
                <div
                  className={`wheel-disc ${spinning ? "spinning" : ""} ${activeSituations.length === 0 ? "empty" : ""}`}
                  ref={wheelRef}
                  style={{ transform: `rotate(${rotation}deg)`, background: createWheelGradient(activeSituations.length) }}
                  aria-hidden="true"
                >
                  {activeSituations.map((situation, index) => {
                    const angle = index * segmentAngle;
                    const flipText = angle > 90 && angle < 270;
                    return (
                      <span
                        className="wheel-label"
                        key={situation.id}
                        style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }}
                      >
                        <b className={flipText ? "flipped" : ""}>{situation.text}</b>
                      </span>
                    );
                  })}
                  <span className="wheel-hub"><b>{activeSituations.length || "0"}</b><small>À TOI !</small></span>
                </div>
              </button>
            </div>

            <div className="wheel-actions">
              <p id="wheel-help"><span aria-hidden="true">↻</span> Clique et fais glisser la roue</p>
              {activeSituations.length > 0 ? (
                <button className="spin-button" type="button" onClick={spinRandomly} disabled={spinning}>
                  {spinning ? "La roue tourne…" : "Tourner au hasard"}
                </button>
              ) : (
                <button className="spin-button reset-primary" type="button" onClick={resetWheel}>Réinitialiser la roue</button>
              )}
            </div>

            <ol className="sr-only">
              {activeSituations.map((situation) => <li key={situation.id}>{situation.text}</li>)}
            </ol>
          </section>

          <aside className="activity-panel" aria-live="polite">
            <div className={`result-card ${selectedSituation ? "revealed" : ""}`}>
              <div className="result-head">
                <span>{selectedSituation ? "Situation sélectionnée" : "Situation surprise"}</span>
                <span className="result-stamp">À conseiller</span>
              </div>
              <div className="result-body">
                <span className="quote-mark" aria-hidden="true">“</span>
                <p>
                  {spinning
                    ? "La roue choisit une situation…"
                    : selectedSituation?.text
                      ?? (activeSituations.length === 0
                        ? "Toutes les situations ont été retirées."
                        : "La phrase sélectionnée sera projetée ici.")}
                </p>
              </div>
              {selectedSituation && !spinning && (
                <div className="result-actions">
                  <button className="delete-button" type="button" onClick={removeSelected}>
                    <span aria-hidden="true">×</span> Éliminer cette phrase
                  </button>
                </div>
              )}
            </div>

            <section className="advice-forms" aria-labelledby="advice-forms-title">
              <h2 className="sr-only" id="advice-forms-title">Quatre structures pour donner un conseil</h2>
              <article className="advice-card advice-green">
                <h3>Il faut<br /><span>+ infinitif</span></h3>
                <p>Exprime une nécessité générale.</p>
              </article>
              <article className="advice-card advice-orange">
                <h3>Il vaut mieux<br /><span>+ infinitif</span></h3>
                <p>Indique la meilleure solution.</p>
              </article>
              <article className="advice-card advice-purple">
                <h3>Devoir<br /><span>+ infinitif</span></h3>
                <p>Obligation ou conseil fort.</p>
              </article>
              <article className="advice-card advice-pink">
                <h3>L’impératif</h3>
                <p>Donne un conseil direct ou une instruction.</p>
              </article>
            </section>

            <div className="panel-tools">
              <div className="steps" aria-label="Étapes de l’activité">
                <div><b>1</b><span>Tourne</span></div>
                <i aria-hidden="true" />
                <div><b>2</b><span>Lis</span></div>
                <i aria-hidden="true" />
                <div><b>3</b><span>Conseille</span></div>
              </div>
              {activeSituations.length < initialSituations.length && activeSituations.length > 0 && (
                <button className="reset-link" type="button" onClick={resetWheel}>Restaurer les 10 phrases</button>
              )}
            </div>
          </aside>
        </div>
      </section>

      <footer>
        <span>La roue des conseils</span>
      </footer>
    </main>
  );
}
