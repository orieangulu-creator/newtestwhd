// Audio player: prefers pre-generated MP3 (offline), falls back to browser speech.
// Supports per-line loop, autoplay-next, variable speed (0.6x–1.0x, pitch preserved).
(function () {
  var audio = new Audio();
  audio.preload = 'auto';
  try { audio.preservesPitch = true; audio.mozPreservesPitch = true; audio.webkitPreservesPitch = true; } catch (e) {}

  var state = {
    current: null,        // current line object {id, en, zh, ...}
    queue: [],            // list of line objects for autoplay
    index: -1,
    loop: false,
    autoplay: false,
    speed: 1.0,
    usingTTS: false,
    onChange: null        // callback(line)
  };
  window.PlayerState = state;

  function audioUrl(id) { return 'audio/' + id + '.mp3'; }

  // Which pre-generated MP3s exist (from audio/manifest.json). Until loaded -> null.
  // If no manifest (no MP3s generated), we go straight to browser speech — more reliable.
  var audioSet = null;
  fetch('audio/manifest.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (list) { audioSet = new Set(list || []); })
    .catch(function () { audioSet = new Set(); });

  // Warm up speech voices (Chrome loads them lazily)
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.getVoices(); } catch (e) {}
    window.speechSynthesis.onvoiceschanged = function () {};
  }

  function speak(line) {
    // Browser speech fallback
    if (!('speechSynthesis' in window)) { onEnded(); return; }
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(line.en);
    u.lang = 'en-US';
    u.rate = Math.max(0.5, state.speed); // map speed onto TTS rate
    u.onend = onEnded;
    state.usingTTS = true;
    window.speechSynthesis.speak(u);
  }

  function onEnded() {
    if (state.loop && state.current) {
      playLine(state.current, state.queue, state.index);
      return;
    }
    if (state.autoplay && state.queue.length && state.index < state.queue.length - 1) {
      var next = state.index + 1;
      playLine(state.queue[next], state.queue, next);
      return;
    }
    setPlayIcon(false);
  }
  audio.addEventListener('ended', onEnded);
  audio.addEventListener('error', function () { if (!state.usingTTS && state.current) fallback(state.current); });

  function fallback(line) {
    if (state.fellBack) return; // avoid double-speak (error event + play() rejection)
    state.fellBack = true;
    speak(line);
  }

  function setPlayIcon(playing) {
    var b = document.getElementById('pbPlay');
    if (b) b.textContent = playing ? '❚❚' : '▶';
  }

  function playLine(line, queue, index) {
    if (!line) return;
    state.current = line;
    if (queue) { state.queue = queue; state.index = (index == null ? -1 : index); }
    state.usingTTS = false;
    state.fellBack = false;
    window.speechSynthesis && window.speechSynthesis.cancel();
    setPlayIcon(true);
    if (state.onChange) state.onChange(line);

    // Use the MP3 only if we know it exists; otherwise speak directly (reliable in Chrome)
    var hasMp3 = audioSet && audioSet.has(line.id + '.mp3');
    if (hasMp3) {
      audio.src = audioUrl(line.id);
      audio.playbackRate = state.speed;
      try { audio.preservesPitch = true; } catch (e) {}
      var p = audio.play();
      if (p && p.catch) { p.catch(function () { fallback(line); }); }
    } else {
      speak(line);
    }
  }

  function toggle() {
    if (state.usingTTS) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause(); setPlayIcon(false);
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume(); setPlayIcon(true);
      } else if (state.current) { speak(state.current); setPlayIcon(true); }
      return;
    }
    if (audio.paused) {
      if (state.current) { audio.play().catch(function(){ speak(state.current); }); setPlayIcon(true); }
    } else { audio.pause(); setPlayIcon(false); }
  }

  function stop() {
    audio.pause();
    window.speechSynthesis && window.speechSynthesis.cancel();
    setPlayIcon(false);
  }

  function setSpeed(s) {
    state.speed = s;
    audio.playbackRate = s;
  }

  window.Player = {
    play: playLine,
    toggle: toggle,
    stop: stop,
    setSpeed: setSpeed,
    setLoop: function (v) { state.loop = v; },
    setAutoplay: function (v) { state.autoplay = v; },
    state: state
  };
})();
