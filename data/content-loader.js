// Loads content.json and exposes window.CONTENT + window.CONTENT_READY (a Promise).
window.CONTENT = null;
window.CONTENT_READY = fetch('data/content.json', { cache: 'no-cache' })
  .then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .then(function (data) {
    window.CONTENT = data;
    return data;
  })
  .catch(function (err) {
    console.error('内容加载失败:', err);
    var v = document.getElementById('view');
    if (v) {
      v.innerHTML =
        '<div class="intro-box">内容加载失败。请通过本地服务器或部署后的网址打开，' +
        '而不是直接双击 index.html。<br>本地可运行：<b>python3 -m http.server</b> 然后访问 ' +
        '<b>http://localhost:8000</b></div>';
    }
    throw err;
  });
