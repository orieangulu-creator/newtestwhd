(function () {
  var view = document.getElementById('view');
  var headerTitle = document.getElementById('headerTitle');
  var backBtn = document.getElementById('backBtn');
  var DATA = null;

  // ---------- helpers ----------
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return (s || '').replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function findScenario(id) { return DATA.scenarios.filter(function (s) { return s.id === id; })[0]; }
  function findLine(scenarioId, lineId) {
    var s = findScenario(scenarioId); if (!s) return null;
    return s.lines.filter(function (l) { return l.id === lineId; })[0];
  }

  // highlight key vocab words inside an English sentence
  function highlightKw(en, vocab) {
    if (!vocab || !vocab.length) return esc(en);
    var out = esc(en);
    vocab.forEach(function (v) {
      var w = v.w;
      var re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i');
      out = out.replace(re, '<span class="kw" data-say="$1">$1</span>');
    });
    return out;
  }

  // ---------- routing ----------
  function go(hash) { location.hash = hash; }
  function parseRoute() {
    var h = (location.hash || '#home').slice(1);
    var parts = h.split('/');
    return { name: parts[0] || 'home', arg: parts[1] || null };
  }

  function render() {
    var r = parseRoute();
    setActiveTab(r.name === 'scenario' ? 'home' : r.name);
    backBtn.classList.toggle('hidden', r.name !== 'scenario');
    if (r.name === 'home') return renderHome();
    if (r.name === 'scenario') return renderScenario(r.arg);
    if (r.name === 'phrasebook') return renderPhrasebook();
    if (r.name === 'review') return renderReview();
    if (r.name === 'cards') return renderCards();
    renderHome();
  }

  function setActiveTab(route) {
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-route') === route);
    });
  }

  // ---------- views ----------
  function renderHome() {
    headerTitle.textContent = '夏威夷英语练习';
    var groups = {};
    DATA.scenarios.forEach(function (s) { (groups[s.category] = groups[s.category] || []).push(s); });
    var html = '<div class="banner"><h2>🌺 三周后出发，加油！</h2><p>' +
      esc(DATA.meta.note) + '</p></div>';
    Object.keys(groups).forEach(function (cat) {
      html += '<div class="section-title">' + esc(cat) + '</div>';
      groups[cat].forEach(function (s) {
        html += '<div class="scene-card" data-scene="' + s.id + '">' +
          '<div class="scene-icon">' + s.icon + '</div>' +
          '<div class="scene-meta"><div class="t">' + esc(s.title) + '</div>' +
          '<div class="s">' + esc(s.subtitle) + '</div>' +
          '<div class="n">' + esc(s.intro) + '</div></div>' +
          '<div class="scene-chev">›</div></div>';
      });
    });
    view.innerHTML = html;
    view.querySelectorAll('.scene-card').forEach(function (c) {
      c.onclick = function () { go('scenario/' + c.getAttribute('data-scene')); };
    });
  }

  var dlgPrefs = { zh: true, tip: true };

  function renderScenario(id) {
    var s = findScenario(id);
    if (!s) { go('home'); return; }
    headerTitle.textContent = s.title;
    var html = '<div class="intro-box">' + s.icon + ' ' + esc(s.intro) + '</div>';
    html += '<div class="toolbar">' +
      '<button id="tZh" class="' + (dlgPrefs.zh ? 'on' : '') + '">中文 ' + (dlgPrefs.zh ? '✓' : '') + '</button>' +
      '<button id="tTip" class="' + (dlgPrefs.tip ? 'on' : '') + '">提示 ' + (dlgPrefs.tip ? '✓' : '') + '</button>' +
      '<button id="tPlayAll">▶ 连播全部</button>' +
      '</div>';
    s.lines.forEach(function (l) {
      var starred = window.Review.isStarred(l.id);
      var role = l.speaker === 'you' ? 'you' : (l.speaker === 'tip' ? 'tip' : 'staff');
      var roleLabel = l.speaker === 'you' ? '你' : (l.speaker === 'tip' ? '常识' : '对方');
      html += '<div class="line ' + role + '" data-line="' + l.id + '">' +
        '<div class="line-top"><span class="role ' + role + '">' + roleLabel + '</span>' +
        '<div class="line-actions">' +
        '<button class="mini-btn play" title="播放">▶</button>' +
        '<button class="mini-btn star ' + (starred ? 'on' : '') + '" title="收藏">' + (starred ? '★' : '☆') + '</button>' +
        '</div></div>' +
        '<div class="line-en">' + highlightKw(l.en, l.vocab) + '</div>' +
        '<div class="line-zh"' + (dlgPrefs.zh ? '' : ' style="display:none"') + '>' + esc(l.zh) + '</div>' +
        (l.tip ? '<div class="line-tip"' + (dlgPrefs.tip ? '' : ' style="display:none"') + '>💡 ' + esc(l.tip) + '</div>' : '') +
        renderVocab(l.vocab) +
        '</div>';
    });
    view.innerHTML = html;

    var lineObjs = s.lines.map(function (l) { return decorate(l, s); });

    view.querySelector('#tZh').onclick = function () { dlgPrefs.zh = !dlgPrefs.zh; renderScenario(id); };
    view.querySelector('#tTip').onclick = function () { dlgPrefs.tip = !dlgPrefs.tip; renderScenario(id); };
    view.querySelector('#tPlayAll').onclick = function () {
      document.getElementById('pbAuto').checked = true; window.Player.setAutoplay(true);
      window.Player.play(lineObjs[0], lineObjs, 0); showBar(lineObjs[0]);
    };

    view.querySelectorAll('.line').forEach(function (node, i) {
      node.querySelector('.play').onclick = function () { window.Player.play(lineObjs[i], lineObjs, i); showBar(lineObjs[i]); };
      var star = node.querySelector('.star');
      star.onclick = function () {
        var on = window.Review.toggle(lineObjs[i]);
        star.classList.toggle('on', on); star.textContent = on ? '★' : '☆';
      };
      node.querySelectorAll('.kw, .chip').forEach(function (k) {
        k.onclick = function (e) {
          e.stopPropagation();
          var word = k.getAttribute('data-say');
          window.Player.play({ id: 'word-' + slug(word), en: word, zh: '' });
          showBar({ id: 'w', en: word, zh: '关键词发音' });
        };
      });
    });
  }

  function renderVocab(vocab) {
    if (!vocab || !vocab.length) return '';
    var h = '<div class="vocab">';
    vocab.forEach(function (v) {
      h += '<span class="chip" data-say="' + esc(v.w) + '">' + esc(v.w) + ' · ' + esc(v.zh) + '</span>';
    });
    return h + '</div>';
  }

  function slug(w) { return w.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
  function decorate(l, s) { return { id: l.id, en: l.en, zh: l.zh, scenario: s.title }; }

  function renderPhrasebook() {
    headerTitle.textContent = '万能救场句';
    var html = '<div class="intro-box">⚡ 听不懂、卡住、需要帮助时，张口就用这些。点 ▶ 反复听。</div>';
    DATA.phrasebook.forEach(function (p) {
      var starred = window.Review.isStarred(p.id);
      html += '<div class="line you" data-line="' + p.id + '">' +
        '<div class="line-top"><span class="role you">救场</span><div class="line-actions">' +
        '<button class="mini-btn play">▶</button>' +
        '<button class="mini-btn star ' + (starred ? 'on' : '') + '">' + (starred ? '★' : '☆') + '</button>' +
        '</div></div>' +
        '<div class="line-en">' + esc(p.en) + '</div>' +
        '<div class="line-zh">' + esc(p.zh) + '</div></div>';
    });
    view.innerHTML = html;
    var objs = DATA.phrasebook.map(function (p) { return { id: p.id, en: p.en, zh: p.zh, scenario: '救场句' }; });
    view.querySelectorAll('.line').forEach(function (node, i) {
      node.querySelector('.play').onclick = function () { window.Player.play(objs[i], objs, i); showBar(objs[i]); };
      var star = node.querySelector('.star');
      star.onclick = function () { var on = window.Review.toggle(objs[i]); star.classList.toggle('on', on); star.textContent = on ? '★' : '☆'; };
    });
  }

  // ---------- review (spaced repetition) ----------
  var revSession = null;
  function renderReview() {
    headerTitle.textContent = '我的复习';
    var total = window.Review.count();
    var due = window.Review.dueCount();
    if (total === 0) {
      view.innerHTML = '<div class="rev-empty">还没有收藏的句子。<br><br>在任意场景点 ☆ 把不熟的句子加进来，' +
        '这里会按遗忘曲线提醒你复习。</div>';
      return;
    }
    if (revSession && revSession.cards.length) return renderFlash();
    view.innerHTML =
      '<div class="rev-stat"><div class="box"><div class="num">' + total + '</div><div class="lbl">已收藏</div></div>' +
      '<div class="box"><div class="num">' + due + '</div><div class="lbl">待复习</div></div></div>' +
      (due > 0
        ? '<button class="big-btn" id="startRev">开始复习 (' + due + ')</button>'
        : '<div class="intro-box">🎉 今天没有到期的复习项，休息一下吧。</div>') +
      '<button class="ghost-btn" id="listenAll">▶ 连续听一遍全部收藏</button>' +
      '<div style="margin-top:14px"></div>' + renderRevList();
    if (due > 0) view.querySelector('#startRev').onclick = function () {
      revSession = { cards: window.Review.dueList(), i: 0, flipped: false }; renderFlash();
    };
    view.querySelector('#listenAll').onclick = function () {
      var objs = window.Review.all();
      document.getElementById('pbAuto').checked = true; window.Player.setAutoplay(true);
      window.Player.play(objs[0], objs, 0); showBar(objs[0]);
    };
    bindRevListStars();
  }

  function renderRevList() {
    var html = '<div class="section-title">全部收藏</div>';
    window.Review.all().forEach(function (c) {
      html += '<div class="line you" data-id="' + c.id + '">' +
        '<div class="line-top"><span class="role you">' + esc(c.scenario || '收藏') + '</span>' +
        '<div class="line-actions"><button class="mini-btn play">▶</button>' +
        '<button class="mini-btn star on">★</button></div></div>' +
        '<div class="line-en">' + esc(c.en) + '</div><div class="line-zh">' + esc(c.zh) + '</div></div>';
    });
    return html;
  }
  function bindRevListStars() {
    view.querySelectorAll('.line[data-id]').forEach(function (node) {
      var id = node.getAttribute('data-id');
      var card = window.Review.all().filter(function (c) { return c.id === id; })[0];
      node.querySelector('.play').onclick = function () { window.Player.play(card); showBar(card); };
      node.querySelector('.star').onclick = function () { window.Review.toggle(card); renderReview(); };
    });
  }

  function renderFlash() {
    var s = revSession;
    if (s.i >= s.cards.length) { revSession = null; renderReview(); return; }
    var c = s.cards[s.i];
    headerTitle.textContent = '复习 ' + (s.i + 1) + '/' + s.cards.length;
    var html = '<div class="flash"><div class="en">' + esc(c.en) + '</div>' +
      (s.flipped
        ? '<div class="zh">' + esc(c.zh) + '</div>'
        : '<div class="hint">先听并回想中文意思，点下面播放或翻面</div>') + '</div>';
    if (!s.flipped) {
      html += '<button class="big-btn" id="flip">显示中文</button>' +
        '<button class="ghost-btn" id="playCard">▶ 听发音</button>';
    } else {
      html += '<div class="rev-rate"><button class="r-again" data-q="0">忘了</button>' +
        '<button class="r-hard" data-q="1">模糊</button>' +
        '<button class="r-good" data-q="2">会了</button></div>';
    }
    view.innerHTML = html;
    window.Player.play(c); showBar(c);
    if (!s.flipped) {
      view.querySelector('#flip').onclick = function () { s.flipped = true; renderFlash(); };
      view.querySelector('#playCard').onclick = function () { window.Player.play(c); showBar(c); };
    } else {
      view.querySelectorAll('.rev-rate button').forEach(function (b) {
        b.onclick = function () {
          window.Review.grade(c.id, parseInt(b.getAttribute('data-q'), 10));
          s.i++; s.flipped = false; renderFlash();
        };
      });
    }
  }

  // ---------- emergency cards ----------
  function renderCards() {
    headerTitle.textContent = '应急沟通卡';
    var ec = DATA.emergencyCards;
    var html = '<div class="intro-box">🆘 ' + esc(ec.intro) + '</div>';
    html += '<div class="ecard">';
    ec.template.forEach(function (row) {
      html += '<div class="ec-row"><div class="ec-en">' + esc(row.label) + '</div>' +
        '<div class="ec-zh">' + esc(row.zh) + '</div></div>';
    });
    html += '</div>';
    html += '<div class="intro-box note-tip">📌 用法：截图本页 → 打印或存进老人手机相册 → 走散/紧急时出示给当地人或拨打 911。' +
      '建议把方括号信息先填好（姓名拼音、你的手机号、Airbnb地址、血型过敏慢病用药）。</div>';
    view.innerHTML = html;
  }

  // ---------- player bar ----------
  function showBar(line) {
    var bar = document.getElementById('playerBar');
    bar.classList.remove('hidden');
    document.getElementById('pbEn').textContent = line.en;
    document.getElementById('pbZh').textContent = line.zh || '';
    var star = document.getElementById('pbStar');
    var on = line.id && window.Review.isStarred(line.id);
    star.classList.toggle('on', !!on); star.textContent = on ? '★' : '☆';
    star._line = line;
  }
  function initBar() {
    document.getElementById('pbPlay').onclick = function () { window.Player.toggle(); };
    document.getElementById('pbClose').onclick = function () {
      window.Player.stop(); document.getElementById('playerBar').classList.add('hidden');
    };
    document.getElementById('pbStar').onclick = function () {
      var line = document.getElementById('pbStar')._line; if (!line || !line.id) return;
      var on = window.Review.toggle(line);
      document.getElementById('pbStar').classList.toggle('on', on);
      document.getElementById('pbStar').textContent = on ? '★' : '☆';
    };
    document.getElementById('pbLoop').onchange = function () { window.Player.setLoop(this.checked); };
    document.getElementById('pbAuto').onchange = function () { window.Player.setAutoplay(this.checked); };
    var speed = document.getElementById('pbSpeed');
    speed.oninput = function () {
      window.Player.setSpeed(parseFloat(this.value));
      document.getElementById('pbSpeedVal').textContent = parseFloat(this.value).toFixed(1) + '×';
    };
    window.PlayerState.onChange = function (line) { showBar(line); markPlaying(line.id); };
  }
  function markPlaying(id) {
    document.querySelectorAll('.line').forEach(function (n) {
      n.classList.toggle('playing', n.getAttribute('data-line') === id);
    });
  }

  // ---------- offline badge + boot ----------
  function updateOnline() {
    var b = document.getElementById('offlineBadge');
    if (navigator.onLine) { b.textContent = '●'; b.classList.remove('off'); b.title = '在线'; }
    else { b.textContent = '✈'; b.classList.add('off'); b.title = '离线（已可用）'; }
  }

  document.getElementById('backBtn').onclick = function () { go('home'); };
  document.querySelectorAll('.tab').forEach(function (t) {
    t.onclick = function () { go(t.getAttribute('data-route')); };
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);

  window.CONTENT_READY.then(function (data) {
    DATA = data;
    initBar();
    updateOnline();
    render();
  });

  // register service worker for offline
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (e) { console.warn('SW failed', e); });
    });
  }
})();
