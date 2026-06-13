// Favorites + spaced repetition (simplified SM-2). Persisted in localStorage.
(function () {
  var KEY = 'hi_review_v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function save(map) { localStorage.setItem(KEY, JSON.stringify(map)); }

  function now() { return Date.now(); }
  var DAY = 86400000;

  function isStarred(id) { return !!load()[id]; }

  // line: {id, en, zh, scenario}
  function toggle(line) {
    var map = load();
    if (map[line.id]) { delete map[line.id]; save(map); return false; }
    map[line.id] = {
      id: line.id, en: line.en, zh: line.zh, scenario: line.scenario || '',
      ease: 2.3, interval: 0, reps: 0, due: now()
    };
    save(map);
    return true;
  }

  function all() {
    var map = load();
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function dueList() {
    var t = now();
    return all().filter(function (c) { return (c.due || 0) <= t; })
      .sort(function (a, b) { return (a.due || 0) - (b.due || 0); });
  }

  // quality: 0 again, 1 hard, 2 good
  function grade(id, quality) {
    var map = load();
    var c = map[id];
    if (!c) return;
    if (quality === 0) {
      c.reps = 0; c.interval = 0; c.ease = Math.max(1.8, c.ease - 0.2);
      c.due = now() + 60000; // 1 min, see again this session
    } else {
      c.reps = (c.reps || 0) + 1;
      if (quality === 1) c.ease = Math.max(1.8, c.ease - 0.05);
      else c.ease = c.ease + 0.1;
      if (c.reps === 1) c.interval = 1;
      else if (c.reps === 2) c.interval = quality === 1 ? 2 : 3;
      else c.interval = Math.round(c.interval * c.ease * (quality === 1 ? 0.8 : 1));
      c.due = now() + c.interval * DAY;
    }
    save(map);
  }

  window.Review = {
    isStarred: isStarred,
    toggle: toggle,
    all: all,
    dueList: dueList,
    grade: grade,
    count: function () { return all().length; },
    dueCount: function () { return dueList().length; }
  };
})();
