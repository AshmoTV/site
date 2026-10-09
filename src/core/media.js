// Lazy video: videos only load when near the viewport and pause when they leave.
let io, posterIO;

export function initMedia(root = document) {
  // posters are lazy too (a <video poster> attribute would download immediately)
  posterIO ||= new IntersectionObserver((entries) => {
    for (const { target: v, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      if (v.dataset.poster && !v.getAttribute('poster')) v.setAttribute('poster', v.dataset.poster);
      posterIO.unobserve(v);
    }
  }, { rootMargin: '600px 300px' });
  root.querySelectorAll('video[data-poster]:not([poster])').forEach((v) => posterIO.observe(v));

  io ||= new IntersectionObserver((entries) => {
    for (const { target: v, isIntersecting } of entries) {
      if (!v.isConnected) { io.unobserve(v); continue; }
      if (isIntersecting) {
        if (!v.src && v.dataset.src) { v.src = v.dataset.src; v.load(); }
        const p = v.play();
        p?.catch?.(() => {});
      } else if (!v.paused) {
        v.pause();
      }
    }
  }, { rootMargin: '200px 0px' });
  root.querySelectorAll('video[data-src]:not([data-observed])').forEach((v) => {
    v.dataset.observed = '';
    io.observe(v);
  });
}

/** Load + play a specific video immediately (e.g. hover previews). */
export function playNow(video) {
  if (!video) return;
  if (video.dataset.poster && !video.getAttribute('poster')) video.setAttribute('poster', video.dataset.poster);
  if (!video.src && video.dataset.src) { video.src = video.dataset.src; video.load(); }
  video.play()?.catch?.(() => {});
}
