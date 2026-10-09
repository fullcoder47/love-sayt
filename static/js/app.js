/* Madina Love Universe — yengil JavaScript, tashqi JS kutubxonasi kerak emas. */
(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('site-data').textContent);
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progressKey = 'madina-universe-progress-v1';
  const blankProgress = { quiz: false, question: false, game: false, letter: false, final: false };
  let progress = { ...blankProgress };
  try {
    const saved = JSON.parse(localStorage.getItem(progressKey) || '{}');
    Object.keys(blankProgress).forEach((key) => { progress[key] = saved[key] === true; });
  } catch (_) { /* Qurilma localStorage'ni bloklagan bo'lishi mumkin. */ }
  const saveProgress = (key) => {
    progress[key] = true;
    try { localStorage.setItem(progressKey, JSON.stringify(progress)); } catch (_) { /* optional */ }
    updateOverallProgress();
  };
  const updateOverallProgress = () => {
    const count = Object.values(progress).filter(Boolean).length;
    $('#overall-progress').textContent = `${Math.round((count / 5) * 100)}%`;
  };
  updateOverallProgress();

  // Kichkina bildirishnoma
  let toastTimer;
  const toastEl = $('#toast');
  function toast(message, duration = 2800) {
    window.clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toastEl.classList.remove('is-visible'), duration);
  }

  // Yulduzlar osmoni — animatsiya qo'llab-quvvatlanmasa statik ko'rinadi
  const canvas = $('#stars');
  const ctx = canvas.getContext('2d');
  let stars = [];
  let size = { w: 0, h: 0 };
  function resizeSky() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    size = { w: window.innerWidth, h: window.innerHeight };
    canvas.width = Math.round(size.w * pixelRatio);
    canvas.height = Math.round(size.h * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const count = size.w < 700 ? 40 : 85;
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * size.w,
      y: Math.random() * size.h,
      r: Math.random() * 1.3 + .28,
      phase: Math.random() * Math.PI * 2,
      speed: .2 + Math.random() * .65
    }));
  }
  function renderSky(time = 0) {
    ctx.clearRect(0, 0, size.w, size.h);
    for (const star of stars) {
      const alpha = reducedMotion ? .65 : .35 + .32 * (1 + Math.sin(time / 1800 * star.speed + star.phase)) / 2;
      ctx.fillStyle = `rgba(255,222,230,${alpha})`;
      ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!reducedMotion) window.requestAnimationFrame(renderSky);
  }
  if (ctx) {
    resizeSky();
    renderSky();
    let resizeJob;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeJob);
      resizeJob = window.setTimeout(() => { resizeSky(); if (reducedMotion) renderSky(); }, 120);
    }, { passive: true });
  }

  // Kirish pardasi
  const intro = $('#intro');
  const main = $('#main');
  const nav = $('#topbar');
  main.inert = true;
  nav.inert = true;
  $('#enter-site').addEventListener('click', () => {
    intro.classList.add('is-exiting');
    intro.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    main.inert = false;
    nav.inert = false;
    window.setTimeout(() => { intro.hidden = true; }, reducedMotion ? 10 : 850);
    toast(`Bu olam faqat sen uchun, ${data.her_name}! 💗`);
    chime();
  });
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 36), { passive: true });

  // Reveal animatsiyalar
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries, ob) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          ob.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px 30px 0px' });
    $$('.reveal').forEach((item) => observer.observe(item));
  } else { $$('.reveal').forEach((item) => item.classList.add('in-view')); }

  // Muloyim, dasturiy sintezlangan musiqa (MP3 kerak emas)
  let audioContext;
  let musicInterval;
  let musicOn = false;
  let melodyIndex = 0;
  const melody = [392, 440, 523.25, 440, 392, 329.63, 349.23, 392, 329.63, 293.66, 329.63, 392, 349.23, 293.66, 261.63, 293.66];
  function note(frequency, duration = .43, volume = .028) {
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + .03);
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(); oscillator.stop(audioContext.currentTime + duration + .03);
    } catch (_) { /* Audio qo'llab-quvvatlanmasa ham sayt ishlaydi. */ }
  }
  function chime() { if (musicOn) note(659.25, .2, .018); }
  function toggleMusic() {
    musicOn = !musicOn;
    const button = $('#music-toggle');
    button.setAttribute('aria-pressed', String(musicOn));
    button.setAttribute('aria-label', musicOn ? 'Musiqani o‘chirish' : 'Musiqani yoqish');
    button.textContent = musicOn ? '♫' : '♪';
    window.clearInterval(musicInterval);
    if (musicOn) {
      melodyIndex = 0;
      note(melody[melodyIndex++], .47, .017);
      musicInterval = window.setInterval(() => {
        if (document.hidden) return;
        note(melody[melodyIndex++ % melody.length], .47, .017);
      }, 610);
      toast('Mayin musiqa yoqildi 🎶');
    } else { toast('Musiqa to‘xtatildi ♡'); }
  }
  $('#music-toggle').addEventListener('click', toggleMusic);

  // Konfetti va qiziqarli yuraklar
  const particles = $('#particle-layer');
  function confetti(quantity = 85) {
    if (reducedMotion) return;
    const colors = ['#f6b7c5', '#e8c69f', '#fff0d9', '#df78a8', '#f5cce6', '#9e83cf'];
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < quantity; i++) {
      const piece = document.createElement('i');
      piece.className = 'confetti-piece';
      piece.style.setProperty('--x', `${Math.random() * 100}%`);
      piece.style.setProperty('--rot', `${Math.random() * 360}deg`);
      piece.style.setProperty('--fall', `${2.4 + Math.random() * 2.8}s`);
      piece.style.setProperty('--drift', `${(Math.random() - .5) * 220}px`);
      piece.style.setProperty('--confetti-color', colors[Math.floor(Math.random() * colors.length)]);
      piece.style.animationDelay = `${Math.random() * .8}s`;
      fragment.appendChild(piece);
      window.setTimeout(() => piece.remove(), 6400);
    }
    particles.appendChild(fragment);
  }
  function heartBurst(element, quantity = 14) {
    if (reducedMotion) return;
    const r = element.getBoundingClientRect();
    for (let i = 0; i < quantity; i++) {
      const heart = document.createElement('span');
      const angle = Math.PI * 2 * i / quantity;
      const distance = 65 + Math.random() * 125;
      heart.className = 'heart-burst';
      heart.textContent = ['💗','💕','💖','✨'][i % 4];
      heart.style.left = `${r.left + r.width / 2}px`;
      heart.style.top = `${r.top + r.height / 2}px`;
      heart.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
      heart.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
      heart.style.setProperty('--rotation', `${(Math.random() - .5) * 150}deg`);
      particles.appendChild(heart);
      window.setTimeout(() => heart.remove(), 1300);
    }
  }

  // Xotira kartochkalari
  $$('.memory-card').forEach((card) => card.addEventListener('click', () => {
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(flipped));
    if (flipped) chime();
  }));

  // 8 ta savolli qiziqarli test
  let quizIndex = 0;
  let chosen = -1;
  const quizQuestion = $('#quiz-question');
  const quizOptions = $('#quiz-options');
  function renderQuiz() {
    const q = data.quiz[quizIndex];
    chosen = -1;
    $('#quiz-play').hidden = false;
    $('#quiz-complete').hidden = true;
    $('#quiz-count').textContent = `${String(quizIndex + 1).padStart(2, '0')} / ${String(data.quiz.length).padStart(2, '0')}`;
    $('#quiz-progress').style.width = `${quizIndex / data.quiz.length * 100}%`;
    $('#quiz-category').textContent = `SAVOL №${String(quizIndex + 1).padStart(2, '0')}`;
    quizQuestion.textContent = q.question;
    quizOptions.replaceChildren();
    $('#quiz-feedback').hidden = true;
    $('#quiz-next').disabled = true;
    $('#quiz-next').innerHTML = quizIndex === data.quiz.length - 1 ? 'Natijani ko‘rish <span aria-hidden="true">↗</span>' : 'Keyingi savol <span aria-hidden="true">→</span>';
    $('#quiz-caption').textContent = 'Javoblardan birini tanla ✨';
    q.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className = 'quiz-option'; button.type = 'button';
      const letter = document.createElement('span');
      letter.className = 'quiz-option-letter';
      letter.textContent = ['A', 'B', 'C'][index] || String(index + 1);
      const label = document.createElement('span'); label.textContent = option.label;
      button.append(letter, label);
      button.addEventListener('click', () => chooseOption(index));
      quizOptions.appendChild(button);
    });
  }
  function chooseOption(index) {
    if (chosen !== -1) return;
    chosen = index;
    $$('.quiz-option', quizOptions).forEach((button, i) => {
      button.disabled = true;
      button.classList.add(i === index ? 'is-selected' : 'is-dimmed');
    });
    $('#quiz-feedback').textContent = data.quiz[quizIndex].options[index].reply;
    $('#quiz-feedback').hidden = false;
    $('#quiz-next').disabled = false;
    $('#quiz-caption').textContent = 'Javob qabul qilindi! 💕';
    $('#quiz-progress').style.width = `${(quizIndex + 1) / data.quiz.length * 100}%`;
    heartBurst($$('.quiz-option', quizOptions)[index], 7);
    chime();
  }
  $('#quiz-next').addEventListener('click', () => {
    if (chosen === -1) return;
    if (quizIndex < data.quiz.length - 1) { quizIndex += 1; renderQuiz(); }
    else {
      $('#quiz-play').hidden = true;
      $('#quiz-complete').hidden = false;
      saveProgress('quiz'); confetti(110);
      toast(`Ajoyib, ${data.pet_name}! Test yakunlandi! 🏆`);
    }
  });
  $('#quiz-replay').addEventListener('click', () => { quizIndex = 0; renderQuiz(); });
  renderQuiz();

  // Sirli qocha oladigan "Yo'q" tugmasi, touch va mouse uchun
  const noButton = $('#no-button');
  const yesButton = $('#yes-button');
  const arena = $('#choice-area');
  let escaped = 0;
  const noResponses = [
    'Voy, bu tugma juda uyatchan ekan! 😂',
    'Yana qochdi! Shu tugmani kim tarbiyalagan? 🙈',
    'Bunday tezlik bilan olimpiadaga ketadi! 🏃',
    'Yo‘q tugmasi ham seni yaxshi ko‘rsa kerak 🤭',
    'Xo‘p, tugma taslim. Lekin hali ham ushlab bo‘lmaydi! 💘',
    'Seni kuldira olsam, men allaqachon yutganman! 😘'
  ];
  function moveNo(event) {
    if (progress.question) return;
    if (event?.cancelable && event.type === 'pointerdown') event.preventDefault();
    escaped += 1;
    const pad = 4;
    const maxX = Math.max(pad, arena.clientWidth - noButton.offsetWidth - pad);
    const maxY = Math.max(pad, arena.clientHeight - noButton.offsetHeight - pad);
    const yesRect = yesButton.getBoundingClientRect();
    const areaRect = arena.getBoundingClientRect();
    let best = { x: pad, y: pad, distance: -Infinity };
    for (let attempt = 0; attempt < 24; attempt++) {
      const x = pad + Math.random() * Math.max(0, maxX - pad);
      const y = pad + Math.random() * Math.max(0, maxY - pad);
      const dx = areaRect.left + x + noButton.offsetWidth / 2 - (yesRect.left + yesRect.width / 2);
      const dy = areaRect.top + y + noButton.offsetHeight / 2 - (yesRect.top + yesRect.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance > best.distance) best = { x, y, distance };
    }
    noButton.style.left = `${best.x}px`;
    noButton.style.top = `${best.y}px`;
    $('#proposal-response').textContent = noResponses[Math.min(escaped - 1, noResponses.length - 1)];
    if (escaped >= 4) noButton.textContent = 'Ushlolmaysan 😜';
  }
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    noButton.addEventListener('pointerenter', moveNo);
  }
  noButton.addEventListener('pointerdown', moveNo);
  noButton.addEventListener('click', moveNo);
  yesButton.addEventListener('click', () => {
    yesButton.textContent = 'YEEEEES! SEN BILAN! 😍';
    noButton.hidden = true;
    $('#proposal-response').textContent = 'Eng chiroyli javob! Endi oldinda millionta birgalikdagi sarguzasht bor. ❤️';
    saveProgress('question'); confetti(120); heartBurst(yesButton, 24);
  });

  // 10 yurak yig'ish mini-o'yini
  const board = $('#game-board');
  const startGame = $('#game-start');
  let gameScore = 0;
  let gameActive = false;
  let spawnTimer;
  const cuteMessages = ['Bitta yurak seniki! 💗', 'Senga muhabbatim ko‘paymoqda! 💞', 'Ana tezlik! 😍', 'Davom et, malikam! ✨', 'Sen eng zo‘risan! 🫶'];
  function spawnHeart() {
    if (!gameActive) return;
    $$('.catch-heart', board).forEach((element) => element.remove());
    const heart = document.createElement('button');
    heart.type = 'button'; heart.className = 'catch-heart';
    heart.textContent = ['💗','💖','💕','💘','💝'][Math.floor(Math.random() * 5)];
    heart.setAttribute('aria-label', 'Yurakchani tutish');
    const x = 42 + Math.random() * Math.max(0, board.clientWidth - 84);
    const y = 42 + Math.random() * Math.max(0, board.clientHeight - 84);
    heart.style.left = `${x}px`; heart.style.top = `${y}px`;
    heart.addEventListener('click', () => {
      if (!gameActive || heart.disabled) return;
      heart.disabled = true;
      heart.classList.add('is-caught');
      gameScore += 1; $('#game-score').textContent = String(gameScore);
      $('#game-status').textContent = cuteMessages[(gameScore - 1) % cuteMessages.length];
      chime();
      if (gameScore >= 10) {
        gameActive = false; saveProgress('game'); confetti(90);
        $('#game-status').textContent = '10/10! Yuragimni ham tutding! 🥹';
        startGame.textContent = 'Yana o‘ynash ↻';
        startGame.disabled = false;
        window.setTimeout(() => {
          heart.remove();
          const success = document.createElement('div');
          success.className = 'game-success';
          success.innerHTML = '<div><strong>💝</strong>10 ta yurak — barchasi senga!<br><small>Bu o‘yinning haqiqiy yutug‘i — sening tabassuming ♡</small></div>';
          board.appendChild(success);
        }, 250);
      } else {
        spawnTimer = window.setTimeout(spawnHeart, 320);
      }
    }, { once: true });
    board.appendChild(heart);
  }
  startGame.addEventListener('click', () => {
    window.clearTimeout(spawnTimer);
    $$('.catch-heart,.game-success', board).forEach((el) => el.remove());
    gameScore = 0; gameActive = true;
    $('#game-score').textContent = '0';
    $('#game-status').textContent = 'Yurakni ushlashga tayyor tur!';
    $('#game-idle').hidden = true;
    startGame.disabled = true;
    spawnHeart();
  });

  // Uchrashuv g'ildiragi
  let dateIndex = -1;
  let spinning = false;
  $('#date-spin').addEventListener('click', () => {
    if (spinning) return;
    spinning = true;
    const button = $('#date-spin');
    button.disabled = true;
    const result = $('#date-result');
    let tick = 0;
    const timer = window.setInterval(() => {
      result.textContent = data.date_ideas[tick % data.date_ideas.length];
      tick += 1;
      if (tick >= 12) {
        window.clearInterval(timer);
        let index = Math.floor(Math.random() * data.date_ideas.length);
        if (index === dateIndex) index = (index + 1) % data.date_ideas.length;
        dateIndex = index;
        result.textContent = data.date_ideas[index];
        spinning = false; button.disabled = false;
        chime();
      }
    }, reducedMotion ? 30 : 90);
  });

  // Accessible modallar
  let previousFocus;
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    previousFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-active');
    const close = $('.modal-close', modal);
    if (close) close.focus();
    if (id === 'final-modal') { saveProgress('final'); confetti(145); }
  }
  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.hidden = true;
    if ($$('.modal:not([hidden])').length === 0) document.body.classList.remove('modal-active');
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    if (id === 'letter-modal') {
      const audio = $('audio', modal);
      if (audio) audio.pause();
    }
  }
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
  document.addEventListener('keydown', (event) => {
    const modal = $('.modal:not([hidden])');
    if (!modal) return;
    if (event.key === 'Escape') { closeModal(modal.id); return; }
    if (event.key === 'Tab') {
      const tabbable = $$('button:not([disabled]),a[href],audio[controls]', modal).filter(el => el.getClientRects().length);
      if (!tabbable.length) return;
      const first = tabbable[0], last = tabbable[tabbable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  function openLetter() { saveProgress('letter'); openModal('letter-modal'); chime(); }
  $('#letter-open').addEventListener('click', openLetter);
  $('#envelope-open').addEventListener('click', openLetter);
  $('#final-open').addEventListener('click', () => openModal('final-modal'));
  $('#final-open-secondary').addEventListener('click', () => openModal('final-modal'));

  // 5 marta yurakka bosib topiladigan yashirin sovg'a
  let secretTaps = 0;
  $('#secret-heart').addEventListener('click', () => {
    secretTaps += 1;
    heartBurst($('#secret-heart'), 8);
    if (secretTaps < 5) toast(`Sirga yaqinlashding... ${secretTaps}/5 💘`, 1100);
    else { secretTaps = 0; openModal('secret-modal'); confetti(60); }
  });

  // Ulashish — native share yoki clipboard
  $('#share-love').addEventListener('click', async () => {
    const shareData = { title: document.title, text: `${data.her_name} uchun yurakdan yaratilgan saytim 💗`, url: location.href.split('#')[0] };
    try {
      if (navigator.share) { await navigator.share(shareData); }
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        toast('Havola nusxalandi! 💌');
      } else { toast('Havolani brauzer manzilidan ulashishingiz mumkin 💌'); }
    } catch (error) {
      if (error.name !== 'AbortError') toast('Havolani brauzer manzilidan ulashishingiz mumkin 💌');
    }
  });
})();
