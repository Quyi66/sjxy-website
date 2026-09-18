(function () {
    'use strict';

    // Content stays visible without JavaScript or observer support.
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || !('IntersectionObserver' in window)) return;

    var targets = document.querySelectorAll(
        '.homepage .hero-system, .homepage .home-service-path li, .homepage .home-value-card, .homepage .home-goal-card'
    );
    if (!targets.length) return;

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('home-motion-entered');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.15 });

    targets.forEach(function (target) { observer.observe(target); });

    // A preference change also stops animations already in progress.
    function stopMotion(event) {
        if (!event.matches) return;
        observer.disconnect();
        targets.forEach(function (target) { target.classList.remove('home-motion-entered'); });
    }
    if (motion.addEventListener) motion.addEventListener('change', stopMotion);
    else if (motion.addListener) motion.addListener(stopMotion);
}());
