// Tiny, dependency-free enhancements.
(function () {
  // Keep the footer year fresh.
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  // Close the mobile nav reflow by blurring any focused anchor after click (helps iOS).
  document.querySelectorAll('.nav-links a, .hero-cta a, .contact-cta a').forEach(function (a) {
    a.addEventListener('click', function () {
      if (a.getAttribute('href') && a.getAttribute('href').charAt(0) === '#') {
        setTimeout(function () { a.blur(); }, 200);
      }
    });
  });
})();
