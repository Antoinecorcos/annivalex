(() => {
  "use strict";

  const P = window.PARTY;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const COLORS = ["#ff3d9a", "#ffc93c", "#2de2e6", "#8a5cff", "#ffffff", "#ff7a3c"];
  const TZ = P.timeZone || "Europe/Paris";
  const partyDate = new Date(P.date);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  /* =========================================================
     Données de config → page
     ========================================================= */
  const derived = {
    dateLong: new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(partyDate),
    timeLabel: "À partir de " + new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(partyDate).replace(":", "h"),
  };
  const resolve = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), { ...P, ...derived });

  $$("[data-bind]").forEach((el) => {
    const v = resolve(el.dataset.bind);
    if (v != null) el.textContent = v;
  });
  // Les blocs dont l'info n'est pas renseignée dans config.js disparaissent
  $$("[data-if]").forEach((el) => {
    const v = resolve(el.dataset.if);
    if (!v || (Array.isArray(v) && !v.length)) el.remove();
  });
  document.title = `L'anniv de ${P.name} 🎉`;
  $("#heroTitle").textContent = P.name;
  $("#footerYear").textContent = partyDate.getFullYear();
  $("#mapsLink").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(P.venue.address);
  if (!matchMedia("(hover: hover)").matches) $(".hint").textContent = "Touche le nom pour l'exploser 👆";
  if ($("#phoneLink")) $("#phoneLink").href = "tel:" + P.contact.phone.replace(/\s/g, "");
  if ($("#deezerLink")) $("#deezerLink").href = P.deezerPlaylistUrl;

  $("#extraInfos").innerHTML = "";
  (P.infos || []).forEach((info) => {
    const card = document.createElement("article");
    card.className = "card mini tilt reveal";
    card.innerHTML = `<div class="card-icon"></div><div><h3></h3><p></p></div>`;
    $(".card-icon", card).textContent = info.icon;
    $("h3", card).textContent = info.title;
    $("p", card).textContent = info.text;
    $("#extraInfos").appendChild(card);
  });

  (P.program || []).forEach((step) => {
    const li = document.createElement("li");
    li.className = "reveal";
    li.innerHTML = `<span class="tl-time"></span><div class="card tl-body tilt"><h3></h3><p class="muted"></p></div>`;
    $(".tl-time", li).textContent = step.time;
    $("h3", li).textContent = step.title;
    $("p", li).textContent = step.desc;
    $("#timeline").appendChild(li);
  });

  const marqueeText = `Joyeux anniversaire ${P.name} ✦ ${P.age} ans ✦ ${derived.dateLong} ✦ `.toUpperCase();
  $("#marquee").innerHTML = Array(8).fill(0).map(() => `<span>${marqueeText.replace(/</g, "&lt;")}</span>`).join("");

  /* =========================================================
     Moteur d'effets plein écran : confettis + feux d'artifice
     ========================================================= */
  const FX = (() => {
    const cv = $("#fx");
    const ctx = cv.getContext("2d");
    let W, H, dpr, parts = [], running = false;

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    addEventListener("resize", resize);
    resize();

    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= p.decay;
        if (p.type === "confetti") {
          p.vy += 0.18; p.vx *= 0.985; p.vy *= 0.985;
          p.x += p.vx + Math.sin(p.tilt) * 0.6; p.y += p.vy;
          p.rot += p.vr; p.tilt += 0.08;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.cos(p.tilt * 1.5)); // effet 3D de rotation
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(1, p.life * 3);
          if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, 7); ctx.fill(); }
          else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else {
          // étincelle de feu d'artifice avec traînée
          p.vy += 0.05; p.vx *= 0.97; p.vy *= 0.97;
          const ox = p.x, oy = p.y;
          p.x += p.vx; p.y += p.vy;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(ox - p.vx * 2, oy - p.vy * 2); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        if (p.life <= 0 || p.y > H + 40) parts.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      if (parts.length) requestAnimationFrame(loop); else { running = false; ctx.clearRect(0, 0, W, H); }
    };
    const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };

    return {
      confetti(x, y, { count = 120, angle = -Math.PI / 2, spread = Math.PI / 3, power = 16 } = {}) {
        if (reducedMotion) count = Math.min(count, 25);
        for (let i = 0; i < count; i++) {
          const a = angle + rand(-spread / 2, spread / 2), v = rand(power * 0.5, power);
          parts.push({ type: "confetti", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: rand(0, 6), vr: rand(-0.2, 0.2), tilt: rand(0, 6), size: rand(7, 13), round: Math.random() < 0.25, color: pick(COLORS), life: 1, decay: rand(0.003, 0.006) });
        }
        kick();
      },
      firework(x, y) {
        const color = pick(COLORS), n = reducedMotion ? 20 : 70;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2, v = rand(2, 7);
          parts.push({ type: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, color: Math.random() < 0.2 ? "#fff" : color, life: 1, decay: rand(0.012, 0.022) });
        }
        kick();
      },
      cannons() {
        this.confetti(0, H, { angle: -Math.PI / 3, spread: 0.6, power: 26, count: 110 });
        this.confetti(W, H, { angle: (-2 * Math.PI) / 3, spread: 0.6, power: 26, count: 110 });
      },
      celebrate() {
        this.cannons();
        [0, 300, 650, 1000].forEach((t) => setTimeout(() => this.firework(rand(W * 0.2, W * 0.8), rand(H * 0.15, H * 0.45)), t));
      },
    };
  })();

  /* =========================================================
     Hero : le prénom en milliers de particules interactives
     ========================================================= */
  (() => {
    const hero = $(".hero");
    const cv = $("#heroCanvas");
    const ctx = cv.getContext("2d");
    const spacer = $(".hero-spacer");
    let W, H, dpr, particles = [], stars = [], visible = true;
    const mouse = { x: -9999, y: -9999 };

    const build = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Dessin du texte hors-écran puis échantillonnage des pixels
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const o = off.getContext("2d");
      const text = P.name.toUpperCase();
      let size = Math.min(W * 0.9 / (text.length * 0.78), 260);
      o.font = `900 ${size}px Unbounded, sans-serif`;
      const measured = o.measureText(text).width;
      if (measured > W * 0.9) { size *= (W * 0.9) / measured; o.font = `900 ${size}px Unbounded, sans-serif`; }
      const r = spacer.getBoundingClientRect(), hr = hero.getBoundingClientRect();
      const cy = r.top - hr.top + r.height / 2;
      o.textAlign = "center"; o.textBaseline = "middle";
      o.fillText(text, W / 2, cy);

      const data = o.getImageData(0, 0, W, H).data;
      const gap = W < 600 ? 4 : 5;
      const targets = [];
      for (let y = 0; y < H; y += gap)
        for (let x = 0; x < W; x += gap)
          if (data[(y * W + x) * 4 + 3] > 128) targets.push([x, y]);

      const old = particles;
      particles = targets.map(([tx, ty], i) => {
        const prev = old[i];
        const grad = tx / W; // dégradé rose → or → cyan selon x
        const color = grad < 0.4 ? (Math.random() < 0.7 ? "#ff3d9a" : "#ffc93c") : grad < 0.7 ? (Math.random() < 0.7 ? "#ffc93c" : "#ff7a3c") : (Math.random() < 0.7 ? "#2de2e6" : "#8a5cff");
        return {
          x: prev ? prev.x : rand(0, W), y: prev ? prev.y : rand(-H * 0.5, H * 1.5),
          vx: 0, vy: 0, tx, ty, color, size: rand(1.6, gap * 0.7), phase: rand(0, 6),
        };
      });
      stars = Array.from({ length: Math.round((W * H) / 9000) }, () => ({ x: rand(0, W), y: rand(0, H), r: rand(0.3, 1.4), p: rand(0, 6) }));
    };

    let t = 0;
    const loop = () => {
      requestAnimationFrame(loop);
      if (!visible) return;
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t + s.p));
        ctx.fillStyle = "#fff";
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      ctx.globalAlpha = 1;
      const R = 110;
      for (const p of particles) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 6;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
        // ressort vers la cible + respiration
        p.vx += (p.tx - p.x) * 0.045; p.vy += (p.ty + Math.sin(t * 2 + p.phase) * 1.2 - p.y) * 0.045;
        p.vx *= 0.84; p.vy *= 0.84;
        p.x += p.vx; p.y += p.vy;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    };

    const setMouse = (e) => {
      const r = cv.getBoundingClientRect();
      const pt = e.touches ? e.touches[0] : e;
      mouse.x = pt.clientX - r.left; mouse.y = pt.clientY - r.top;
    };
    hero.addEventListener("pointermove", setMouse);
    hero.addEventListener("touchmove", setMouse, { passive: true });
    hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    hero.addEventListener("click", (e) => {
      if (e.target.closest("a,button")) return;
      FX.firework(e.clientX, e.clientY);
      // onde de choc dans les particules
      for (const p of particles) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy) || 1;
        if (d < 300) { p.vx += (dx / d) * (300 - d) * 0.15; p.vy += (dy / d) * (300 - d) * 0.15; }
      }
    });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(hero);
    let rT; addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(build, 150); });

    (document.fonts ? document.fonts.load("900 100px Unbounded").catch(() => {}) : Promise.resolve()).then(() => { build(); loop(); });
  })();

  /* =========================================================
     Compte à rebours
     ========================================================= */
  (() => {
    const els = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
    let celebrated = false;
    const set = (el, v) => {
      v = String(v).padStart(2, "0");
      if (el.textContent !== v) {
        el.textContent = v;
        el.classList.remove("flip"); void el.offsetWidth; el.classList.add("flip");
      }
    };
    const tick = () => {
      let diff = Math.max(0, partyDate - Date.now());
      const d = Math.floor(diff / 864e5); diff -= d * 864e5;
      const h = Math.floor(diff / 36e5); diff -= h * 36e5;
      const m = Math.floor(diff / 6e4); diff -= m * 6e4;
      set(els.d, d); set(els.h, h); set(els.m, m); set(els.s, Math.floor(diff / 1000));
      if (partyDate - Date.now() <= 0 && !celebrated) {
        celebrated = true;
        $(".eyebrow").textContent = "🎉 C'est le jour J ! Joyeux anniversaire";
        FX.celebrate();
      }
    };
    tick();
    setInterval(tick, 1000);

    // Âge qui s'incrémente
    const ageEl = $("#ageNum");
    let n = 0;
    const step = () => { n++; ageEl.textContent = n; if (n < P.age) setTimeout(step, 900 / P.age + n * 2); };
    setTimeout(step, 600);
  })();

  /* =========================================================
     Interactions : apparitions, cartes 3D, bouton magnétique, halo
     ========================================================= */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 80}ms`; io.observe(el); });

  if (finePointer && !reducedMotion) {
    $$(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 12}deg) translateZ(0)`;
        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });

    $$(".btn-magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px, ${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });

    const glow = $(".cursor-glow");
    addEventListener("pointermove", (e) => {
      glow.style.setProperty("--x", e.clientX + "px");
      glow.style.setProperty("--y", e.clientY + "px");
    });
  }

  /* =========================================================
     Ajout au calendrier (.ics)
     ========================================================= */
  $("#calBtn").addEventListener("click", () => {
    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const end = new Date(partyDate.getTime() + 5 * 36e5);
    const esc = (s) => String(s).replace(/([,;\\])/g, "\\$1");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//annivalex//FR", "BEGIN:VEVENT",
      `UID:anniv-${P.name}-${fmt(partyDate)}@annivalex`, `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(partyDate)}`, `DTEND:${fmt(end)}`,
      `SUMMARY:${esc(`🎉 Anniversaire de ${P.name}`)}`,
      `LOCATION:${esc(`${P.venue.name}, ${P.venue.address}`)}`,
      `DESCRIPTION:${esc(`Dress code : ${P.dressCode}`)}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `anniv-${P.name.toLowerCase()}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  /* =========================================================
     Musique : "Joyeux anniversaire" synthétisé en Web Audio
     ========================================================= */
  (() => {
    const btn = $("#musicBtn");
    let actx, master, playing = false, timer;
    // [note MIDI, durée en temps]
    const G4 = 67, A4 = 69, B4 = 71, C5 = 72, D5 = 74, E5 = 76, F5 = 77, G5 = 79;
    const melody = [
      [G4, .75], [G4, .25], [A4, 1], [G4, 1], [C5, 1], [B4, 2],
      [G4, .75], [G4, .25], [A4, 1], [G4, 1], [D5, 1], [C5, 2],
      [G4, .75], [G4, .25], [G5, 1], [E5, 1], [C5, 1], [B4, 1], [A4, 2],
      [F5, .75], [F5, .25], [E5, 1], [C5, 1], [D5, 1], [C5, 3],
    ];
    const bass = [[48, 3], [43, 3], [43, 3], [48, 3], [48, 3], [53, 3], [53, 3], [48, 3]];
    const beat = 0.5;
    const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

    const note = (m, t, dur, type, vol) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = freq(m);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + dur);
    };

    const playOnce = () => {
      let t = actx.currentTime + 0.1, tb = t + beat;
      melody.forEach(([m, d]) => { note(m, t, d * beat, "triangle", 0.25); note(m + 12, t, d * beat, "sine", 0.05); t += d * beat; });
      bass.forEach(([m, d]) => { note(m, tb, d * beat, "sine", 0.18); tb += d * beat; });
      const total = melody.reduce((s, [, d]) => s + d, 0) * beat;
      timer = setTimeout(() => playing && playOnce(), (total + 1.2) * 1000);
    };

    btn.addEventListener("click", () => {
      if (!actx) {
        actx = new (window.AudioContext || window.webkitAudioContext)();
        master = actx.createGain(); master.gain.value = 0.6;
        // petite réverb façon écho
        const delay = actx.createDelay(); delay.delayTime.value = 0.22;
        const fb = actx.createGain(); fb.gain.value = 0.25;
        master.connect(actx.destination);
        master.connect(delay); delay.connect(fb).connect(delay); delay.connect(actx.destination);
      }
      playing = !playing;
      btn.setAttribute("aria-pressed", playing);
      if (playing) { actx.resume(); playOnce(); }
      else { clearTimeout(timer); actx.suspend(); }
    });
  })();

  /* =========================================================
     Gâteau : souffler les bougies au micro
     ========================================================= */
  (() => {
    const wrap = $("#candles"), msg = $("#cakeMsg"), meter = $("#meterFill");
    const micBtn = $("#micBtn"), relight = $("#relightBtn");
    const N = Math.min(Math.max(P.age, 1), 7);
    let stream, raf;

    const candles = Array.from({ length: N }, () => {
      const c = document.createElement("div");
      c.className = "candle";
      c.innerHTML = '<span class="flame"></span>';
      c.addEventListener("click", () => blow(c));
      wrap.appendChild(c);
      return c;
    });
    const lit = () => candles.filter((c) => !c.classList.contains("out"));

    const blow = (c) => {
      if (c.classList.contains("out")) return;
      c.classList.add("out");
      if (!lit().length) done();
    };
    const done = () => {
      stopMic();
      msg.innerHTML = "";
      msg.textContent = `🎉 Joyeux anniversaire ${P.name} ! 🎉`;
      relight.hidden = false;
      FX.celebrate();
    };
    const stopMic = () => {
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      stream = null;
      meter.style.width = "0";
      micBtn.disabled = false;
      micBtn.textContent = "🎤 Souffler avec le micro";
    };

    relight.addEventListener("click", () => {
      candles.forEach((c) => c.classList.remove("out"));
      relight.hidden = true;
      msg.textContent = "";
    });

    micBtn.addEventListener("click", async () => {
      if (stream) return stopMic();
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
      } catch {
        msg.textContent = "Micro indisponible — clique sur les flammes 🔥";
        return;
      }
      micBtn.textContent = "⏹ Arrêter le micro";
      msg.textContent = "Souffle !! 🌬️";
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const an = actx.createAnalyser();
      an.fftSize = 1024;
      actx.createMediaStreamSource(stream).connect(an);
      const buf = new Float32Array(an.fftSize);
      let level = 0, streak = 0;
      const loop = () => {
        an.getFloatTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += v * v;
        level = level * 0.7 + Math.sqrt(sum / buf.length) * 0.3;
        meter.style.width = Math.min(100, level * 600) + "%";
        // un souffle = signal fort et soutenu
        streak = level > 0.09 ? streak + 1 : Math.max(0, streak - 2);
        if (streak > 6 && Math.random() < 0.25) { const l = lit(); if (l.length) blow(pick(l)); }
        if (stream) raf = requestAnimationFrame(loop); else actx.close();
      };
      loop();
    });
  })();

  /* =========================================================
     Stockage partagé : Google Sheets (via Apps Script) ou mode démo local
     ========================================================= */
  const ENDPOINT = (P.rsvpEndpoint || "").trim();
  const ME_KEY = "annivalex-me";
  const keyOf = (n) => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
  const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } };

  const Store = (() => {
    const listeners = [];
    let state = { guests: [], songs: [] };
    const emit = (s) => { state = { guests: s.guests || [], songs: s.songs || [] }; listeners.forEach((fn) => fn(state)); return state; };
    const local = {
      read() { return JSON.parse(safeGet("annivalex-demo") || '{"guests":[],"songs":[]}'); },
      write(s) { safeSet("annivalex-demo", JSON.stringify(s)); return s; },
    };
    const call = async (body) => {
      // text/plain = requête "simple", évite le pré-vol CORS d'Apps Script
      const r = await fetch(ENDPOINT, body ? { method: "POST", body: JSON.stringify(body) } : { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      return j;
    };
    return {
      onChange(fn) { listeners.push(fn); },
      get state() { return state; },
      async refresh() { return emit(ENDPOINT ? await call() : local.read()); },
      async rsvp(data) {
        if (ENDPOINT) return emit(await call({ type: "rsvp", ...data }));
        const s = local.read();
        const i = s.guests.findIndex((g) => keyOf(g.name) === keyOf(data.name));
        const rec = { name: data.name, status: data.status, guests: data.guests };
        if (i >= 0) s.guests[i] = rec; else s.guests.push(rec);
        return emit(local.write(s));
      },
      async addSong(song) {
        if (ENDPOINT) return emit(await call({ type: "song", ...song }));
        const s = local.read();
        if (!s.songs.some((x) => String(x.id) === String(song.id))) s.songs.push(song);
        return emit(local.write(s));
      },
    };
  })();
  if (!ENDPOINT) $$(".demo-note").forEach((n) => { n.hidden = false; });

  const animateNum = (el, to) => {
    const from = +el.textContent || 0;
    if (from === to) return;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 700);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* =========================================================
     RSVP
     ========================================================= */
  (() => {
    const form = $("#rsvpForm"), msg = $("#formMsg"), submit = $("#submitBtn");
    const guestsField = $("#guestsField"), guestsInput = $("#guestsInput"), nameInput = $("#nameInput");
    const MAX = Math.max(1, P.maxGuestsPerReply || 1);
    guestsInput.max = MAX;
    if (MAX === 1) guestsField.remove();

    Store.onChange(({ guests }) => {
      const me = keyOf(safeGet(ME_KEY) || "");
      const present = guests.filter((g) => g.status === "present");
      animateNum($("#statPresent"), present.length);
      animateNum($("#statPeople"), present.reduce((s, g) => s + (+g.guests || 1), 0));
      animateNum($("#statAbsent"), guests.length - present.length);
      const ul = $("#guestChips");
      ul.innerHTML = "";
      if (!present.length) {
        ul.innerHTML = '<li class="muted">Personne pour l\'instant… sois le premier !</li>';
        return;
      }
      present.forEach((g, i) => {
        const li = document.createElement("li");
        li.textContent = g.name;
        if (+g.guests > 1) {
          const s = document.createElement("small");
          s.textContent = ` +${g.guests - 1}`;
          li.appendChild(s);
        }
        if (me && keyOf(g.name) === me) li.classList.add("me");
        li.style.animationDelay = `${Math.min(i, 30) * 30}ms`;
        ul.appendChild(li);
      });
    });

    const refresh = () => Store.refresh().catch(() => {
      $("#guestChips").innerHTML = '<li class="muted">Impossible de charger la liste pour le moment.</li>';
    });
    refresh();
    if (ENDPOINT) setInterval(() => { if (!document.hidden) refresh(); }, 30000);

    // Pré-remplissage si la personne a déjà répondu
    const saved = safeGet(ME_KEY);
    if (saved) nameInput.value = saved;

    $$('input[name="status"]').forEach((r) => r.addEventListener("change", () => {
      if (guestsField.isConnected) guestsField.classList.toggle("hidden", form.status.value === "absent");
    }));
    $$(".stepper button").forEach((b) => b.addEventListener("click", () => {
      guestsInput.value = Math.min(MAX, Math.max(1, (+guestsInput.value || 1) + +b.dataset.step));
    }));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.className = "form-msg";
      const name = nameInput.value.trim().replace(/\s+/g, " ");
      const status = form.status.value;
      if (name.length < 2) { msg.textContent = "Indique ton prénom 🙂"; msg.classList.add("err"); nameInput.focus(); return; }
      if (!status) { msg.textContent = "Dis-nous si tu viens !"; msg.classList.add("err"); return; }
      const data = {
        name, status,
        guests: status === "present" ? Math.min(MAX, Math.max(1, +guestsInput.value || 1)) : 0,
        message: form.message.value.trim().slice(0, 400),
      };
      submit.disabled = true;
      submit.textContent = "Envoi…";
      try {
        await Store.rsvp(data);
        safeSet(ME_KEY, name);
        Store.refresh().catch(() => {}); // re-rendu avec la puce "moi"
        msg.classList.add("ok");
        if (status === "present") {
          msg.textContent = `Génial ${name.split(" ")[0]} ! On t'attend 🥳`;
          const r = submit.getBoundingClientRect();
          FX.confetti(r.left + r.width / 2, r.top, { count: 160, spread: Math.PI / 1.6, power: 18 });
          FX.cannons();
        } else {
          msg.textContent = "Dommage… merci d'avoir répondu 💜";
        }
        form.message.value = "";
        const by = $("#songBy");
        if (by && !by.value) by.value = name;
      } catch (err) {
        msg.textContent = "Oups, l'envoi a échoué. Réessaie dans un instant.";
        msg.classList.add("err");
      } finally {
        submit.disabled = false;
        submit.textContent = "Envoyer ma réponse";
      }
    });
  })();

  /* =========================================================
     Playlist : recherche Deezer, extraits 30 s, ajout par les invités
     ========================================================= */
  (() => {
    const input = $("#songSearch"), results = $("#searchResults"), list = $("#songList"), by = $("#songBy");
    const audio = new Audio();
    let playingId = null, playingBtn = null, searchSeq = 0;
    by.value = safeGet(ME_KEY) || "";

    // L'API publique Deezer n'envoie pas d'en-têtes CORS : on passe par JSONP
    const jsonp = (url) => new Promise((resolve, reject) => {
      const cb = "dz_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      const s = document.createElement("script");
      const cleanup = () => { clearTimeout(timer); window[cb] = () => {}; s.remove(); };
      const timer = setTimeout(() => { cleanup(); reject(new Error("timeout")); }, 8000);
      window[cb] = (d) => { cleanup(); d && d.error ? reject(new Error(d.error.message)) : resolve(d); };
      s.onerror = () => { cleanup(); reject(new Error("network")); };
      s.src = `${url}${url.includes("?") ? "&" : "?"}output=jsonp&callback=${cb}`;
      document.head.appendChild(s);
    });

    const stop = () => {
      audio.pause();
      if (playingBtn) playingBtn.closest(".track").classList.remove("playing");
      playingId = playingBtn = null;
    };
    audio.addEventListener("ended", stop);
    audio.addEventListener("timeupdate", () => {
      if (playingBtn) playingBtn.style.setProperty("--p", (audio.currentTime / (audio.duration || 30)) * 100 + "%");
    });

    const play = async (track, btn) => {
      if (playingId === track.id) return stop();
      stop();
      playingId = track.id; playingBtn = btn;
      btn.closest(".track").classList.add("playing");
      try {
        // les liens d'extraits expirent : on en redemande un frais si besoin
        const preview = track.preview || (await jsonp(`https://api.deezer.com/track/${encodeURIComponent(track.id)}`)).preview;
        if (playingId !== track.id) return;
        if (!preview) throw new Error("no preview");
        audio.src = preview;
        await audio.play();
      } catch {
        if (playingId === track.id) stop();
      }
    };

    const trackEl = (t, { action, label, sub }) => {
      const li = document.createElement("li");
      li.className = "track";
      li.innerHTML = `
        <button class="tr-play" type="button" aria-label="Écouter l'extrait"><img alt="" loading="lazy" /><span class="tr-icon"></span><span class="eq"><i></i><i></i><i></i><i></i></span></button>
        <div class="tr-meta"><b></b><span></span></div>
        <button class="tr-add" type="button"></button>`;
      $("img", li).src = t.cover || "";
      $("b", li).textContent = t.title;
      $(".tr-meta span", li).textContent = sub;
      $(".tr-play", li).addEventListener("click", (e) => play(t, e.currentTarget));
      const add = $(".tr-add", li);
      if (action) { add.textContent = label; add.addEventListener("click", () => action(add)); }
      else {
        add.replaceWith(Object.assign(document.createElement("a"), {
          className: "tr-add", href: `https://www.deezer.com/track/${t.id}`, target: "_blank", rel: "noopener", textContent: "↗", title: "Ouvrir sur Deezer",
        }));
      }
      return li;
    };

    const renderSongs = ({ songs }) => {
      $("#songCount").textContent = songs.length ? `${songs.length} son${songs.length > 1 ? "s" : ""}` : "";
      const ids = new Set(songs.map((s) => String(s.id)));
      $$(".tr-add[data-id]", results).forEach((b) => { if (ids.has(b.dataset.id)) { b.textContent = "✓"; b.disabled = true; } });
      list.innerHTML = "";
      if (!songs.length) { list.innerHTML = '<li class="muted empty">Aucun son pour l\'instant. Lance la soirée !</li>'; return; }
      [...songs].reverse().forEach((s, i) => {
        const li = trackEl(s, { sub: `${s.artist}${s.by ? " · ajouté par " + s.by : ""}` });
        li.style.animationDelay = `${Math.min(i, 20) * 40}ms`;
        if (String(s.id) === String(playingId)) li.classList.add("playing");
        list.appendChild(li);
      });
    };
    Store.onChange(renderSongs);

    const search = async (q) => {
      const seq = ++searchSeq;
      if (q.length < 2) { results.innerHTML = ""; return; }
      results.innerHTML = '<li class="muted empty">Recherche…</li>';
      try {
        const res = await jsonp(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=8`);
        if (seq !== searchSeq) return;
        results.innerHTML = "";
        if (!res.data || !res.data.length) { results.innerHTML = '<li class="muted empty">Aucun résultat 🤷</li>'; return; }
        const already = new Set(Store.state.songs.map((s) => String(s.id)));
        res.data.forEach((d, i) => {
          const t = { id: d.id, title: d.title, artist: d.artist.name, cover: d.album.cover_small, preview: d.preview };
          const li = trackEl(t, {
            sub: t.artist,
            label: already.has(String(t.id)) ? "✓" : "+",
            action: async (btn) => {
              btn.disabled = true; btn.textContent = "…";
              try {
                const who = by.value.trim().slice(0, 40);
                if (who) safeSet(ME_KEY, safeGet(ME_KEY) || who);
                const { preview, ...song } = t;
                await Store.addSong({ ...song, by: who });
                btn.textContent = "✓";
                const r = btn.getBoundingClientRect();
                FX.confetti(r.left + r.width / 2, r.top + r.height / 2, { count: 50, spread: Math.PI * 2, power: 9 });
              } catch {
                btn.disabled = false; btn.textContent = "+";
              }
            },
          });
          const addBtn = $(".tr-add", li);
          addBtn.dataset.id = t.id;
          addBtn.setAttribute("aria-label", `Ajouter ${t.title} à la playlist`);
          if (already.has(String(t.id))) addBtn.disabled = true;
          li.style.animationDelay = `${i * 35}ms`;
          results.appendChild(li);
        });
      } catch {
        if (seq === searchSeq) results.innerHTML = '<li class="muted empty">Deezer ne répond pas, réessaie dans un instant.</li>';
      }
    };
    let debounce;
    input.addEventListener("input", () => { clearTimeout(debounce); debounce = setTimeout(() => search(input.value.trim()), 300); });
  })();

  // Petite salve d'accueil
  if (!reducedMotion) setTimeout(() => FX.cannons(), 900);
})();
