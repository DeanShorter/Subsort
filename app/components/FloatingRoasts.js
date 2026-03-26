'use client';
import { useEffect, useRef } from 'react';

const roasts = [
  "347 channels. That's not a subscription list, that's a census.",
  "Subscribed for 3 years. Watched 2 videos.",
  "12 fitness channels. 0 fitness videos.",
  "43%. Dumpster fire.",
  "239 channels paying emotional rent.",
  "I gave you a list. You ignored it.",
  "The tasks will outlive us both.",
  "847 subscriptions. I need a moment.",
  "Not angry. Just disappointed.",
  "4 more channels. Unbelievable.",
  "Your cortisol levels called.",
  "52 channels. Never watched.",
  "Seen worse. Also seen better.",
  "Serial Subscriber. Not a compliment.",
  "You and your dead channels deserve each other.",
  "Getting worse, not better.",
  "93% Sports. 0% Fitness.",
  "Remember when you said you'd fix this?",
  "Fine. Whatever.",
  "Suspiciously clean.",
  "Still here?",
  "Prove me wrong.",
  "Dumpster fire.",
  "Getting there. Barely.",
  "Almost proud.",
  "Unsubscribe. I dare you.",
];

export default function FloatingRoasts() {
  const containerRef = useRef(null);
  const activeRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || window.innerWidth < 768) return;

    const MAX = 12;
    const r = (a, b) => a + Math.random() * (b - a);
    const ri = (a, b) => Math.floor(r(a, b));
    const pick = (a) => a[ri(0, a.length)];

    const layers = [
      { sizeMin: 10, sizeMax: 13, opMin: 0.04, opMax: 0.07, blurMin: 3, blurMax: 6, speedMin: 15000, speedMax: 35000 },
      { sizeMin: 13, sizeMax: 18, opMin: 0.06, opMax: 0.12, blurMin: 1, blurMax: 3, speedMin: 10000, speedMax: 25000 },
      { sizeMin: 18, sizeMax: 26, opMin: 0.08, opMax: 0.15, blurMin: 0, blurMax: 1.5, speedMin: 8000, speedMax: 18000 },
      { sizeMin: 26, sizeMax: 42, opMin: 0.03, opMax: 0.06, blurMin: 0, blurMax: 0.5, speedMin: 12000, speedMax: 22000 },
      { sizeMin: 42, sizeMax: 72, opMin: 0.02, opMax: 0.04, blurMin: 2, blurMax: 5, speedMin: 18000, speedMax: 40000 },
    ];

    function spawn() {
      if (activeRef.current.length >= MAX) return;
      const text = pick(roasts);
      const layer = pick(layers);
      const el = document.createElement('div');
      el.className = 'lp-float-roast';

      const size = r(layer.sizeMin, layer.sizeMax);
      const opacity = r(layer.opMin, layer.opMax);
      const blur = r(layer.blurMin, layer.blurMax);
      const angle = r(-18, 18);
      const speed = r(layer.speedMin, layer.speedMax);
      const typeSpeed = size > 30 ? r(40, 80) : r(15, 45);

      el.style.fontSize = size + 'px';
      el.style.filter = 'blur(' + blur.toFixed(1) + 'px)';
      el.style.transform = 'rotate(' + angle.toFixed(1) + 'deg)';
      if (size > 30) el.style.fontWeight = '500';
      if (size > 50) el.style.fontFamily = 'var(--font-display)';

      const W = window.innerWidth;
      const H = document.documentElement.scrollHeight;
      const m = 400;
      const patterns = [
        () => ({ x0: -m, y0: r(0, H), x1: W + m, y1: r(0, H) }),
        () => ({ x0: W + m, y0: r(0, H), x1: -m, y1: r(0, H) }),
        () => ({ x0: -m, y0: r(0, H * 0.3), x1: W + m, y1: r(H * 0.6, H) }),
        () => ({ x0: W + m, y0: r(H * 0.6, H), x1: -m, y1: r(0, H * 0.3) }),
      ];
      const path = pick(patterns)();
      el.style.left = path.x0 + 'px';
      el.style.top = path.y0 + 'px';
      container.appendChild(el);
      activeRef.current.push(el);

      let ci = 0;
      const cursor = document.createElement('span');
      cursor.className = 'lp-fr-cursor';
      cursor.style.height = Math.min(size * 0.85, 20) + 'px';

      function typeChar() {
        if (ci === 0) { el.textContent = ''; el.appendChild(cursor); el.style.opacity = opacity; }
        if (ci < text.length) {
          el.insertBefore(document.createTextNode(text[ci]), cursor);
          ci++;
          setTimeout(typeChar, typeSpeed + Math.random() * typeSpeed * 0.5);
        } else {
          setTimeout(() => { cursor.remove(); drift(); }, r(200, 600));
        }
      }

      function drift() {
        el.style.transition = `left ${speed}ms ease-in-out, top ${speed}ms ease-in-out, opacity 1.5s ease`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.left = path.x1 + 'px';
          el.style.top = path.y1 + 'px';
        }));
        setTimeout(() => { el.style.opacity = '0'; }, speed - 2000);
        setTimeout(() => {
          el.remove();
          const i = activeRef.current.indexOf(el);
          if (i > -1) activeRef.current.splice(i, 1);
        }, speed + 500);
      }

      setTimeout(typeChar, r(100, 500));
    }

    let running = true;
    function loop() {
      if (!running) return;
      setTimeout(() => { spawn(); loop(); }, r(400, 2000));
    }
    setTimeout(() => { for (let i = 0; i < 5; i++) setTimeout(spawn, i * 300); loop(); }, 500);

    return () => { running = false; activeRef.current.forEach(el => el.remove()); activeRef.current = []; };
  }, []);

  return <div className="lp-floating-roasts" ref={containerRef} />;
}
