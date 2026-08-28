function toggleAccordion(btn) {
  var body = btn.nextElementSibling;
  var isOpen = body.classList.contains('open');
  // close all
  document.querySelectorAll('.f-accordion-body').forEach(function(b){ b.classList.remove('open'); });
  document.querySelectorAll('.f-accordion-btn').forEach(function(b){ b.classList.remove('open'); });
  if (!isOpen) {
    body.classList.add('open');
    btn.classList.add('open');
  }
}

// Nav — fully transparent at top, very lightly tinted as you scroll
// (on mobile the hamburger needs to stay readable, so it keeps its
// blurred/tinted background at all scroll positions, not just on scroll)
var nav = document.querySelector('nav');
function updateNav() {
  var scrollY = window.scrollY;
  var isMobile = window.innerWidth <= 768;
  if (scrollY < 10 && !isMobile) {
    nav.style.background = 'transparent';
    nav.style.borderBottomColor = 'transparent';
    nav.style.backdropFilter = 'none';
    nav.style.webkitBackdropFilter = 'none';
  } else {
    // opacity scales from 0.0 (0.08 floor on mobile) at top to max 0.12 after 300px scroll
    var opacity = Math.min(scrollY / 300 * 0.12, 0.12);
    if (isMobile) opacity = Math.max(opacity, 0.08);
    nav.style.background = 'rgba(8,8,8,' + opacity + ')';
    nav.style.borderBottomColor = 'rgba(255,255,255,' + (opacity * 0.2) + ')';
    nav.style.backdropFilter = 'blur(6px)';
    nav.style.webkitBackdropFilter = 'blur(6px)';
  }
}
window.addEventListener('scroll', updateNav, { passive: true });
window.addEventListener('resize', updateNav);
updateNav();
// TICKER — auto-scroll + drag (mouse) + touch swipe
var ticker = document.getElementById('teamTicker');
if (ticker) {
  // Clone cards for infinite loop
  ticker.innerHTML += ticker.innerHTML;

  var lastFrame = 0;
  var deltaTime = 0;
  var pos = 0;
  //var speed = window.innerWidth <= 768 ? 1.0 : 0.7;
  var secondsPerScroll = 45; // Amount of time one full ticker loop should take
  var fullSpeed = ticker.scrollWidth / (secondsPerScroll * 2); 
  var speed = fullSpeed
  var targetSpeed = fullSpeed;
  var halfW = ticker.scrollWidth / 2;
  var dragging = false;
  var dragStartX = 0;
  var dragStartPos = 0;
  var autoPlay = true;
  var raf;

  // https://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
  function lerp(a, b, lambda, dt)
  {
    return a + (1 - Math.exp(-lambda * dt)) * (b - a);
  }

  function step(time) {
    deltaTime = (time - lastFrame) / 1000;
    lastFrame = time;
    if (autoPlay && !dragging) {
      speed = lerp(speed, targetSpeed, 0.99, deltaTime*2);
      if (Math.abs(speed) > 1) pos += speed * deltaTime;
      if (pos >= halfW) pos -= halfW;
      ticker.style.transform = 'translateX(' + (-pos) + 'px)';
    }
    raf = requestAnimationFrame(step);
  }
  ticker.style.animation = 'none';
  raf = requestAnimationFrame(step);

  // MOUSE drag (desktop)
  ticker.addEventListener('mousedown', function(e) {
    dragging = true; autoPlay = false;
    dragStartX = e.clientX; dragStartPos = pos;
    ticker.style.cursor = 'grabbing';
    targetSpeed = 0; speed = 0;
  });
  window.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    var delta = dragStartX - e.clientX;
    pos = dragStartPos + delta;
    if (pos < 0) pos += halfW;
    if (pos >= halfW) pos -= halfW;
    ticker.style.transform = 'translateX(' + (-pos) + 'px)';
  });
  window.addEventListener('mouseup', function() {
    if (!dragging) return;
    dragging = false; autoPlay = true;
    ticker.style.cursor = '';
  });
  ticker.addEventListener('mouseenter', function(e) {
    targetSpeed = 0;
  });
  ticker.addEventListener('mouseleave', function(e) {
    targetSpeed = fullSpeed;
  });

  // TOUCH drag (mobile)
  var touchStartY = 0;
  var isHorizontal = false;
  ticker.addEventListener('touchstart', function(e) {
    dragStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    dragStartPos = pos;
    isHorizontal = false;
    dragging = true; autoPlay = false;
  }, { passive: false });
  ticker.addEventListener('touchmove', function(e) {
    if (!dragging) return;
    var dx = Math.abs(e.touches[0].clientX - dragStartX);
    var dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (!isHorizontal && dy > dx) { dragging = false; autoPlay = true; return; }
    isHorizontal = true;
    e.preventDefault();
    var delta = dragStartX - e.touches[0].clientX;
    pos = dragStartPos + delta;
    if (pos < 0) pos += halfW;
    if (pos >= halfW) pos -= halfW;
    ticker.style.transform = 'translateX(' + (-pos) + 'px)';
  }, { passive: false });
  ticker.addEventListener('touchend', function() {
    dragging = false; autoPlay = true;
  });
}

// Scroll reveal
if ('IntersectionObserver' in window) {
  document.body.classList.add('js-ready');
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
}

// Hamburger
function toggleMenu() {
  var links = document.querySelector('.nav-links');
  var isOpen = links.getAttribute('data-open') === 'true';
  if (isOpen) {
    links.removeAttribute('style');
    links.setAttribute('data-open', 'false');
    // move it back inside nav, before the hamburger, restoring desktop layout
    var hamburger = nav.querySelector('.hamburger');
    nav.insertBefore(links, hamburger);
  } else {
    // nav has its own backdrop-filter on mobile, which makes it a containing
    // block for fixed descendants -- that traps this panel's blur to nav's
    // own 68px strip instead of the real page behind it. Move it out to
    // <body> so its blur samples the actual page, same as the rover page's
    // (whose nav never gets a backdrop-filter, so it never had this problem).
    document.body.appendChild(links);
    links.style.cssText = 'display:flex;flex-direction:column;position:fixed;top:68px;left:0;right:0;background:rgba(8,8,8,0.1);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:2rem;gap:1.5rem;border-bottom:1px solid rgba(46,207,207,0.15);z-index:99;';
    links.setAttribute('data-open', 'true');
  }
}

// Close the dropdown when the user taps/clicks anywhere outside of it
// (but not on the hamburger itself, which already toggles it).
document.addEventListener('click', function(e) {
  var links = document.querySelector('.nav-links');
  if (!links || links.getAttribute('data-open') !== 'true') return;
  var hamburger = nav.querySelector('.hamburger');
  if (links.contains(e.target) || (hamburger && hamburger.contains(e.target))) return;
  toggleMenu();
});

// "We are hiring" popup (mobile only, home page only, shows on every load)
(function() {
  if (window.innerWidth > 768) return;
  var path = location.pathname;
  var isHome = path === '/' || /(^|\/)index\.html$/.test(path);
  if (!isHome) return;

  window.addEventListener('load', function() {
    setTimeout(function() {
      var popup = document.createElement('div');
      popup.className = 'hiring-popup';
      popup.innerHTML =
        '<a href="join-us.html" class="hiring-popup-link">' +
          '<span class="hiring-popup-title">We are hiring</span>' +
          '<span class="hiring-popup-cta">Click here</span>' +
        '</a>' +
        '<button class="hiring-popup-close" aria-label="Close" type="button">&times;</button>';
      document.body.appendChild(popup);
      var dismissed = false;
      popup.querySelector('.hiring-popup-close').addEventListener('click', function() {
        dismissed = true;
        popup.remove();
      });
      window.addEventListener('scroll', function() {
        if (dismissed) return;
        popup.classList.toggle('hiring-popup-hidden', window.scrollY > 10);
      }, { passive: true });
    }, 1200);
  });
})();

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    var target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      var links = document.querySelector('.nav-links');
      links.removeAttribute('style');
      links.setAttribute('data-open', 'false');
      nav.insertBefore(links, nav.querySelector('.hamburger'));
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});