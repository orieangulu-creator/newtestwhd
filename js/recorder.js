// Simple voice recorder for shadowing practice (record your voice, compare to original).
// No scoring, no upload — everything stays in the browser memory for the session.
(function () {
  var mediaRecorder = null;
  var chunks = [];
  var stream = null;
  var recording = false;

  var supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

  function start() {
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
      stream = s;
      chunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      mediaRecorder.start();
      recording = true;
    });
  }

  function stop() {
    return new Promise(function (resolve) {
      if (!mediaRecorder) { resolve(null); return; }
      mediaRecorder.onstop = function () {
        var blob = new Blob(chunks, { type: 'audio/webm' });
        var url = URL.createObjectURL(blob);
        recording = false;
        if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
        resolve(url);
      };
      try { mediaRecorder.stop(); } catch (e) { recording = false; resolve(null); }
    });
  }

  var playback = new Audio();
  function playUrl(url) {
    if (!url) return;
    playback.src = url;
    playback.play().catch(function () {});
  }

  window.Recorder = {
    supported: supported,
    isRecording: function () { return recording; },
    start: start,
    stop: stop,
    playUrl: playUrl
  };
})();
