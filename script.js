// Tiny, dependency-free enhancements.
(function () {
  // Keep the footer year fresh.
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  // Blur focused anchors after click so the focus ring doesn't linger on iOS.
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function () {
      setTimeout(function () { a.blur(); }, 200);
    });
  });
})();
