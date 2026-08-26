import {useCallback, useEffect, useRef, useState} from 'react';
import {motion} from 'motion/react';
import Matter from 'matter-js';
import confetti from 'canvas-confetti';

const GLYPHS = ['K', 'r', 'i', 't', 'i', 'k', 'a'];
const HELLO_COLORS = ['#32b9ad', '#e2b321', '#f08a3c', '#eb5b61', '#d85b9d', '#886bd8', '#4f83d8'];
const MESSAGE = 'You see how these letters always come back together? Similarly, no matter what life throws at you, you always pull yourself together — my superwoman.';
const AFFECTION_LINE = 'I love you ❤️';
const LOVE_LINE = 'Happy 3 years, my love.';
type Phase = 'play' | 'settling' | 'complete';

type CharacterToken = {character: string; index: number};
type WordToken = {characters: CharacterToken[]};

function makeWords(text: string, start = 0) {
  let index = start;
  const words: WordToken[] = text.split(' ').filter(Boolean).map(word => ({
    characters: Array.from(word).reduce<string[]>((graphemes, character) => {
      if (character === '\uFE0F' && graphemes.length) graphemes[graphemes.length - 1] += character;
      else graphemes.push(character);
      return graphemes;
    }, []).map(character => ({character, index: index++})),
  }));
  return {words, next: index};
}

const messageData = makeWords(MESSAGE);
const affectionData = makeWords(AFFECTION_LINE, messageData.next);
const loveData = makeWords(LOVE_LINE, affectionData.next);
const ALL_CHARACTERS = [...messageData.words, ...affectionData.words, ...loveData.words].flatMap(word => word.characters);
const seeded = (value: number) => {
  const result = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return result - Math.floor(result);
};
const particlePosition = (index: number) => ({
  left: 2 + seeded(index + 4) * 96,
  top: 11 + seeded(index + 79) * 80,
  rotation: -28 + seeded(index + 151) * 56,
  duration: 10 + seeded(index + 217) * 11,
  delay: -seeded(index + 307) * 13,
});

function AmbientMessage({revealed, progress, resetKey, onRestart}: {revealed: boolean; progress: number; resetKey: number; onRestart: () => void}) {
  const sourceRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const targetRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const runToken = useRef(0);
  const revealedRef = useRef(revealed);
  const progressRef = useRef(progress);
  const [assembled, setAssembled] = useState(false);

  useEffect(() => {revealedRef.current = revealed;}, [revealed]);
  useEffect(() => {progressRef.current = progress;}, [progress]);

  useEffect(() => {
    type Particle = {x: number; y: number; vx: number; vy: number; angle: number; phase: number; radius: number};
    let frame = 0;
    let previous = performance.now();
    const fontSize = parseFloat(getComputedStyle(sourceRefs.current[0] ?? document.documentElement).fontSize) || 20;
    const margin = fontSize * .7;
    const targets = targetRefs.current.map(element => {
      const rect = element?.getBoundingClientRect();
      return rect ? {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2} : {x: window.innerWidth / 2, y: window.innerHeight * .62};
    });
    const particles: Particle[] = ALL_CHARACTERS.map((_, index) => ({
      x: margin + seeded(index + 4) * Math.max(1, window.innerWidth - margin * 2),
      y: 92 + seeded(index + 79) * Math.max(1, window.innerHeight - 128),
      vx: (seeded(index + 401) - .5) * 1.05,
      vy: (seeded(index + 503) - .5) * .9,
      angle: particlePosition(index).rotation,
      phase: seeded(index + 607) * Math.PI * 2,
      radius: fontSize * (.28 + seeded(index + 701) * .1),
    }));

    const draw = (now: number) => {
      const step = Math.min(2, Math.max(.25, (now - previous) / 16.667));
      previous = now;
      if (!revealedRef.current) {
        const cohesion = Math.pow(progressRef.current, 1.65);
        const flowTime = now * .00022;
        for (let index = 0; index < particles.length; index += 1) {
          const particle = particles[index];
          const target = targets[index];
          const flowAngle = Math.sin(particle.y * .007 + flowTime + particle.phase) * 1.15 + Math.cos(particle.x * .0055 - flowTime * .8) * .82;
          const freeFlight = 1 - cohesion * .68;
          particle.vx += Math.cos(flowAngle) * .015 * freeFlight * step;
          particle.vy += Math.sin(flowAngle) * .015 * freeFlight * step;
          particle.vx += (target.x - particle.x) * .000052 * cohesion * step;
          particle.vy += (target.y - particle.y) * .000052 * cohesion * step;
          particle.vx *= 1 - (.0018 + .003 * cohesion) * step;
          particle.vy *= 1 - (.0018 + .003 * cohesion) * step;
          const speed = Math.hypot(particle.vx, particle.vy);
          const speedLimit = 1.22 - cohesion * .42;
          if (speed > speedLimit) {particle.vx = particle.vx / speed * speedLimit; particle.vy = particle.vy / speed * speedLimit;}
          particle.x += particle.vx * step;
          particle.y += particle.vy * step;
          const desiredAngle = Math.atan2(particle.vy, particle.vx) * 4.2 + Math.sin(flowTime * 5 + particle.phase) * 4 * freeFlight;
          particle.angle += (desiredAngle - particle.angle) * .025 * step;
          if (particle.x < margin) {particle.x = margin; particle.vx = Math.abs(particle.vx) * .94;}
          if (particle.x > window.innerWidth - margin) {particle.x = window.innerWidth - margin; particle.vx = -Math.abs(particle.vx) * .94;}
          if (particle.y < 88 + margin) {particle.y = 88 + margin; particle.vy = Math.abs(particle.vy) * .94;}
          if (particle.y > window.innerHeight - margin) {particle.y = window.innerHeight - margin; particle.vy = -Math.abs(particle.vy) * .94;}
        }
        for (let a = 0; a < particles.length; a += 1) {
          for (let b = a + 1; b < particles.length; b += 1) {
            const first = particles[a];
            const second = particles[b];
            const dx = second.x - first.x;
            const dy = second.y - first.y;
            const minimum = (first.radius + second.radius) * (1 - cohesion * .66);
            const neighbourhood = 82;
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared <= 0 || distanceSquared >= neighbourhood * neighbourhood) continue;
            const distance = Math.sqrt(distanceSquared);
            const nx = dx / distance;
            const ny = dy / distance;
            const alignment = .0015 * (1 - distance / neighbourhood) * (1 - cohesion * .35);
            const velocityX = (second.vx - first.vx) * alignment;
            const velocityY = (second.vy - first.vy) * alignment;
            first.vx += velocityX;
            first.vy += velocityY;
            second.vx -= velocityX;
            second.vy -= velocityY;
            if (distance < minimum) {
              const separation = (minimum - distance) * .018;
              first.vx -= nx * separation;
              first.vy -= ny * separation;
              second.vx += nx * separation;
              second.vy += ny * separation;
            }
          }
        }
        particles.forEach((particle, index) => {
          const element = sourceRefs.current[index];
          if (element) element.style.transform = `translate3d(${particle.x}px,${particle.y}px,0) translate(-50%,-50%) rotate(${particle.angle}deg)`;
        });
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [resetKey]);

  useEffect(() => {
    const token = ++runToken.current;
    if (!revealed) {
      setAssembled(false);
      sourceRefs.current.forEach(element => {
        if (!element) return;
        element.getAnimations().forEach(animation => animation.cancel());
        element.style.left = '0';
        element.style.top = '0';
        element.style.opacity = '';
        element.style.filter = '';
      });
      return;
    }

    const timer = window.setTimeout(() => {
      const animations = sourceRefs.current.map((element, index) => {
        const target = targetRefs.current[index];
        if (!element || !target) return null;
        const start = element.getBoundingClientRect();
        const finish = target.getBoundingClientRect();
        element.style.left = '0';
        element.style.top = '0';
        element.style.opacity = '.72';
        const arc = (seeded(index + 809) - .5) * 62;
        const startX = start.left + start.width / 2;
        const startY = start.top + start.height / 2;
        const finishX = finish.left + finish.width / 2;
        const finishY = finish.top + finish.height / 2;
        return element.animate([
          {transform: `translate3d(${startX}px,${startY}px,0) translate(-50%,-50%) rotate(${particlePosition(index).rotation}deg)`, opacity: .72},
          {offset: .68, transform: `translate3d(${startX + (finishX - startX) * .78 + arc}px,${startY + (finishY - startY) * .78 - Math.abs(arc) * .2}px,0) translate(-50%,-50%) rotate(${index % 2 ? 18 : -18}deg)`, opacity: .92},
          {transform: `translate3d(${finishX}px,${finishY}px,0) translate(-50%,-50%) rotate(0deg)`, opacity: 1},
        ], {duration: 3100 + (index % 8) * 85, delay: (index % 15) * 34, easing: 'cubic-bezier(.22,.72,.18,1)', fill: 'forwards'});
      }).filter((animation): animation is Animation => Boolean(animation));

      Promise.all(animations.map(animation => animation.finished)).then(() => {
        if (runToken.current !== token) return;
        setAssembled(true);
        sourceRefs.current.forEach(element => {if (element) element.style.opacity = '0';});
        confetti({particleCount: 62, spread: 88, startVelocity: 24, scalar: .62, origin: {y: .69}, colors: HELLO_COLORS, disableForReducedMotion: true});
      });
    }, 260);
    return () => window.clearTimeout(timer);
  }, [revealed, resetKey]);

  const renderWords = (words: WordToken[]) => words.map((word, wordIndex) => <span className="message-word" key={wordIndex}>{word.characters.map(({character, index}) => <span className="message-character" key={index} ref={element => {targetRefs.current[index] = element;}}>{character}</span>)}</span>);

  return <div className={`ambient-message ${revealed ? 'is-gathering' : ''} ${assembled ? 'is-assembled' : ''}`}>
    <div className="particle-field" aria-hidden="true">{ALL_CHARACTERS.map(({character, index}) => {
      const position = particlePosition(index);
      return <span key={index} ref={element => {sourceRefs.current[index] = element;}} className="ambient-character" style={{left: 0, top: 0, '--float-rotation': `${position.rotation}deg`} as React.CSSProperties}>{character}</span>;
    })}</div>
    <div className="assembled-copy" aria-live="polite">
      <p>{renderWords(messageData.words)}</p>
      <div className="affection-line">{renderWords(affectionData.words)}</div>
      <div className="love-line">{renderWords(loveData.words)}</div>
    </div>
    {assembled && <button className="restart" onClick={onRestart}>PLAY AGAIN <span>↻</span></button>}
  </div>;
}

function PhysicsStage({phase, resetKey, onTouch}: {phase: Phase; resetKey: number; onTouch: (index: number) => void}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const glyphRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const homesRef = useRef<{x: number; y: number; angle: number}[]>([]);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    let colorStep = 0;
    const paint = () => {
      if (phaseRef.current !== 'play') return;
      glyphRefs.current.forEach((element, index) => {if (element) element.style.color = HELLO_COLORS[(index + colorStep) % HELLO_COLORS.length];});
      colorStep = (colorStep + 1) % HELLO_COLORS.length;
    };
    const first = window.setTimeout(paint, 80);
    const timer = window.setInterval(paint, 5600);
    return () => {window.clearTimeout(first); window.clearInterval(timer);};
  }, []);

  useEffect(() => {
    if (phase === 'play') return;
    glyphRefs.current.forEach((element, index) => {if (element) element.style.color = HELLO_COLORS[index];});
  }, [phase]);

  const nudge = useCallback((index: number) => {
    const body = bodiesRef.current[index];
    if (!body || phaseRef.current !== 'play') return;
    onTouch(index);
    Matter.Body.setVelocity(body, {x: (Math.random() - .5) * 21, y: -9 - Math.random() * 8});
    Matter.Body.setAngularVelocity(body, (Math.random() - .5) * .34);
  }, [onTouch]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const {Bodies, Body, Composite, Engine, Events, Mouse, MouseConstraint} = Matter;
    const engine = Engine.create({enableSleeping: false});
    engine.gravity.scale = 0;
    engine.positionIterations = 11;
    engine.velocityIterations = 9;
    let frame = 0;
    let last = performance.now();
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const gap = width < 720 ? 2 : Math.min(5, width * .004);
    const maxLetter = width < 720 ? 56 : 118;
    const letterWidth = Math.min(maxLetter, (width - (width < 720 ? 36 : 210) - gap * 6) / 7);
    const letterHeight = letterWidth * 1.38;
    const wordWidth = letterWidth * 7 + gap * 6;
    const start = (width - wordWidth) / 2 + letterWidth / 2;
    homesRef.current = GLYPHS.map((_, index) => ({x: start + index * (letterWidth + gap), y: height * .34, angle: 0}));

    const bodies = GLYPHS.map((glyph, index) => Bodies.rectangle(homesRef.current[index].x, homesRef.current[index].y, letterWidth * .96, letterHeight * .9, {label: `glyph-${index}-${glyph}`, chamfer: {radius: letterWidth * .1}, restitution: .91, friction: .01, frictionAir: .0065, density: .0017, angle: 0}));
    const wall = 100;
    const boundaries = [Bodies.rectangle(width / 2, -wall / 2, width + wall * 2, wall, {isStatic: true}), Bodies.rectangle(width / 2, height + wall / 2, width + wall * 2, wall, {isStatic: true}), Bodies.rectangle(-wall / 2, height / 2, wall, height + wall * 2, {isStatic: true}), Bodies.rectangle(width + wall / 2, height / 2, wall, height + wall * 2, {isStatic: true})];
    bodiesRef.current = bodies;
    Composite.add(engine.world, [...bodies, ...boundaries]);
    const mouse = Mouse.create(stage);
    const mouseConstraint = MouseConstraint.create(engine, {mouse, constraint: {stiffness: .13, damping: .1} as Matter.IConstraintDefinition});
    Composite.add(engine.world, mouseConstraint);
    const beforeUpdate = () => {
      bodies.forEach((body, index) => {
        const home = homesRef.current[index];
        if (!home) return;
        const boundedX = Math.max(letterWidth * .56, Math.min(width - letterWidth * .56, body.position.x));
        const boundedY = Math.max(letterHeight * .56, Math.min(height - letterHeight * .56, body.position.y));
        if (boundedX !== body.position.x || boundedY !== body.position.y) Body.setPosition(body, {x: boundedX, y: boundedY});
        const dx = home.x - body.position.x;
        const dy = home.y - body.position.y;
        if (phaseRef.current === 'settling' || phaseRef.current === 'complete') {
          Body.applyForce(body, body.position, {x: dx * body.mass * .00019, y: dy * body.mass * .00019});
          Body.setVelocity(body, {x: body.velocity.x * .875, y: body.velocity.y * .875});
          Body.setAngularVelocity(body, body.angularVelocity * .72);
          Body.setAngle(body, body.angle * .9);
        } else if (!mouseConstraint.body) {
          Body.applyForce(body, body.position, {x: dx * body.mass * .0000044, y: dy * body.mass * .0000044});
          Body.setAngularVelocity(body, body.angularVelocity * .91);
          Body.setAngle(body, Math.abs(body.angle) < .0025 ? 0 : body.angle * .965);
        }
      });
    };
    const tick = (now: number) => {Engine.update(engine, Math.min(32, now - last)); last = now; bodies.forEach((body, index) => {const element = glyphRefs.current[index]; const shouldLockUpright = phaseRef.current === 'complete' || (!mouseConstraint.body && Math.abs(body.angle) < .0025); if (shouldLockUpright) {Body.setAngle(body, 0); Body.setAngularVelocity(body, 0);} const angle = shouldLockUpright ? 0 : body.angle; if (element) element.style.transform = `translate3d(${body.position.x}px,${body.position.y}px,0) translate(-50%,-50%) rotate(${angle}rad)`;}); frame = requestAnimationFrame(tick);};
    Events.on(engine, 'beforeUpdate', beforeUpdate);
    frame = requestAnimationFrame(tick);
    return () => {cancelAnimationFrame(frame); Events.off(engine, 'beforeUpdate', beforeUpdate); Mouse.clearSourceEvents(mouse); Composite.clear(engine.world, false, true); Engine.clear(engine);};
  }, [onTouch]);

  useEffect(() => {
    if (phase !== 'complete') return;
    bodiesRef.current.forEach((body, index) => {const home = homesRef.current[index]; if (!home) return; Matter.Body.setPosition(body, home); Matter.Body.setVelocity(body, {x: 0, y: 0}); Matter.Body.setAngle(body, 0); Matter.Body.setAngularVelocity(body, 0); Matter.Body.setStatic(body, true);});
  }, [phase]);

  useEffect(() => {
    if (!resetKey) return;
    bodiesRef.current.forEach((body, index) => {const home = homesRef.current[index]; if (!home) return; Matter.Body.setStatic(body, false); Matter.Body.setPosition(body, home); Matter.Body.setVelocity(body, {x: 0, y: 0}); Matter.Body.setAngle(body, 0); Matter.Body.setAngularVelocity(body, 0);});
  }, [resetKey]);

  return <div className={`physics-stage phase-${phase}`} ref={stageRef} aria-label="Interactive physics playground"><div className="home-line" aria-hidden="true" />{GLYPHS.map((glyph, index) => <button key={`${glyph}-${index}`} ref={element => {glyphRefs.current[index] = element;}} className="physics-letter" style={{color: HELLO_COLORS[index]}} onPointerDown={() => onTouch(index)} onKeyDown={event => {if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); nudge(index);}}} aria-label={`Move letter ${glyph}`}>{glyph}</button>)}</div>;
}

function Progress({count, phase}: {count: number; phase: Phase}) {
  const progress = phase === 'complete' ? 100 : Math.round(count / GLYPHS.length * 100);
  return <div className="progress" aria-label={`${progress}% complete`}><div className="progress-copy"><span>{phase === 'settling' ? 'PULLING TOGETHER' : phase === 'complete' ? 'FOUND HER WAY HOME' : 'MESS AROUND'}</span><b>{String(Math.min(count, 7)).padStart(2, '0')} / 07</b></div><div className="progress-track"><motion.i animate={{width: `${progress}%`}} transition={{type: 'spring', stiffness: 120, damping: 20}} /></div></div>;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('play');
  const [throws, setThrows] = useState(0);
  const [night, setNight] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const phaseRef = useRef<Phase>('play');
  useEffect(() => {phaseRef.current = phase;}, [phase]);

  const touch = useCallback((_index: number) => {if (phaseRef.current !== 'play') return; setThrows(previous => Math.min(GLYPHS.length, previous + 1));}, []);
  useEffect(() => {if (throws < GLYPHS.length || phase !== 'play') return; const gather = window.setTimeout(() => setPhase('settling'), 850); return () => window.clearTimeout(gather);}, [phase, throws]);
  useEffect(() => {if (phase !== 'settling') return; setNight(false); const complete = window.setTimeout(() => setPhase('complete'), 1900); return () => window.clearTimeout(complete);}, [phase]);

  const moveLight = (event: React.PointerEvent<HTMLElement>) => {mainRef.current?.style.setProperty('--cursor-x', `${event.clientX}px`); mainRef.current?.style.setProperty('--cursor-y', `${event.clientY}px`); mainRef.current?.style.setProperty('--drift-x', `${(event.clientX / window.innerWidth - .5) * 28}px`); mainRef.current?.style.setProperty('--drift-y', `${(event.clientY / window.innerHeight - .5) * 22}px`);};
  const restart = () => {setThrows(0); setPhase('play'); setNight(false); setResetKey(value => value + 1);};

  return <main ref={mainRef} onPointerMove={moveLight} className={`${night ? 'is-night' : ''} is-${phase}`}>
    <div className="ambient" aria-hidden="true"><i /><i /><i /><i /></div><div className="grain" aria-hidden="true" /><div className="torch" aria-hidden="true" />
    <AmbientMessage revealed={phase === 'complete'} progress={throws / GLYPHS.length} resetKey={resetKey} onRestart={restart} />
    <header className="site-header"><a className="monogram" href="#top" aria-label="Developed by Naveen Meena">Developed by Naveen Meena</a><div className="occasion">26 · 08 · 2026 <span>THREE YEARS</span></div><button className="mode-toggle" onClick={() => setNight(value => !value)} disabled={phase !== 'play'} aria-pressed={night}><span>{night ? 'LIGHTS ON' : 'NIGHT'}</span><i>{night ? '☀' : '◐'}</i></button></header>
    <Progress count={throws} phase={phase} />
    <section className="playground" id="top"><div className="intro-copy"><span>HEY BABY.</span><p>{phase === 'settling' ? 'Watch everything find its place.' : phase === 'complete' ? 'Right where every piece belongs.' : night ? 'Move the torch. Find her. Throw her around.' : 'Pull them. Throw them. Try to make a mess.'}</p></div><PhysicsStage phase={phase} resetKey={resetKey} onTouch={touch} /><div className="instruction"><i aria-hidden="true">↗</i><span>{throws === 0 ? 'DRAG ANY LETTER' : throws < 7 ? `${7 - throws} ${7 - throws === 1 ? 'THROW' : 'THROWS'} TO GO` : phase === 'play' ? 'THAT SHOULD DO IT' : phase === 'settling' ? 'COMING BACK TOGETHER' : 'AND THERE SHE IS'}</span></div></section>
  </main>;
}
