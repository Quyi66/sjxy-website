(function () {
    'use strict';
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var desktop = window.matchMedia('(min-width: 992px) and (hover: hover)');

    // Reserve the measured navbar height so fixing it never covers page content.
    document.querySelectorAll('.navbar.navbar-dark').forEach(function (navbar) {
        var spacer = document.createElement('div');
        spacer.setAttribute('aria-hidden', 'true');
        spacer.className = 'navbar-spacer';
        navbar.parentNode.insertBefore(spacer, navbar);
        function syncNavbarHeight() {
            var height = Math.ceil(navbar.getBoundingClientRect().height);
            spacer.style.height = height + 'px';
            document.documentElement.style.setProperty('--site-navbar-height', height + 'px');
        }
        syncNavbarHeight();
        navbar.classList.add('site-fixed-navbar');
        syncNavbarHeight();
        if ('ResizeObserver' in window) new ResizeObserver(syncNavbarHeight).observe(navbar);
        window.addEventListener('resize', syncNavbarHeight);
        navbar.addEventListener('shown.bs.collapse', syncNavbarHeight);
        navbar.addEventListener('hidden.bs.collapse', syncNavbarHeight);
    });

    // Keep artwork and CTA fixed; transition only the two text messages.
    document.querySelectorAll('.hero-text-carousel').forEach(function (element) {
        var messages = element.querySelectorAll('.hero-message');
        var current = 0;
        var busy = false;
        var hovering = false;
        var inView = !('IntersectionObserver' in window);
        var timer;
        function updatePlayback() {
            clearTimeout(timer);
            if (!busy && inView && !reducedMotion.matches && !document.hidden && !hovering && !element.contains(document.activeElement)) {
                timer = setTimeout(function () { changeMessage(1); }, 8000);
            }
        }
        function changeMessage(direction) {
            if (busy || messages.length < 2) return;
            busy = true;
            clearTimeout(timer);
            var previous = messages[current];
            previous.classList.add('is-leaving');
            setTimeout(function () {
                previous.classList.remove('is-current', 'is-leaving');
                previous.setAttribute('aria-hidden', 'true');
                current = (current + direction + messages.length) % messages.length;
                messages[current].classList.add('is-current');
                messages[current].setAttribute('aria-hidden', 'false');
                setTimeout(function () {
                    busy = false;
                    updatePlayback();
                }, reducedMotion.matches ? 0 : 160);
            }, reducedMotion.matches ? 0 : 160);
        }
        element.querySelectorAll('[data-hero-direction]').forEach(function (button) {
            button.addEventListener('click', function () { changeMessage(Number(button.dataset.heroDirection)); });
        });
        var touchStart;
        element.addEventListener('touchstart', function (event) {
            touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
        }, { passive: true });
        element.addEventListener('touchend', function (event) {
            if (!touchStart) return;
            var dx = event.changedTouches[0].clientX - touchStart.x;
            var dy = event.changedTouches[0].clientY - touchStart.y;
            touchStart = null;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) changeMessage(dx < 0 ? 1 : -1);
        }, { passive: true });
        element.addEventListener('mouseenter', function () { hovering = true; updatePlayback(); });
        element.addEventListener('mouseleave', function () { hovering = false; updatePlayback(); });
        element.addEventListener('focusin', updatePlayback);
        element.addEventListener('focusout', function () { setTimeout(updatePlayback, 0); });
        document.addEventListener('visibilitychange', updatePlayback);
        if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', updatePlayback);
        if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) {
            inView = entries[0].isIntersecting;
            updatePlayback();
        }, { threshold: 0.1 }).observe(element);
        updatePlayback();
    });
    // One controller owns navbar dropdowns. Bootstrap hover opening moves focus
    // to the trigger, which used to keep menus open and conflict with clicks.
    var navMenus = [];
    document.querySelectorAll('.navbar .dropdown').forEach(function (dropdown) {
        var toggle = dropdown.querySelector('.dropdown-toggle');
        var menu = dropdown.querySelector('.dropdown-menu');
        if (!toggle || !menu) return;
        // Bootstrap delegates keydown in the capture phase to .dropdown-menu.
        // Give this independently controlled menu its own class as well.
        menu.classList.remove('dropdown-menu');
        menu.classList.add('nav-submenu');
        toggle.removeAttribute('data-bs-toggle');
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('aria-expanded', 'false');
        if (!menu.id) menu.id = 'nav-submenu-' + navMenus.length;
        toggle.setAttribute('aria-controls', menu.id);
        var closeTimer;
        var open = false;
        var hoverOpened = false;
        var keyboardMode = false;
        function setOpen(next, fromHover) {
            clearTimeout(closeTimer);
            if (next) navMenus.forEach(function (other) { if (other.element !== dropdown) other.close(); });
            open = next;
            hoverOpened = !!fromHover;
            dropdown.classList.toggle('nav-open', next);
            toggle.classList.toggle('show', next);
            menu.classList.toggle('show', next);
            toggle.setAttribute('aria-expanded', String(next));
        }
        navMenus.push({ element: dropdown, close: function () { setOpen(false); } });
        dropdown.addEventListener('pointerenter', function (event) {
            clearTimeout(closeTimer);
            if (desktop.matches && event.pointerType !== 'touch' && !open) {
                keyboardMode = false;
                setOpen(true, true);
            }
        });
        dropdown.addEventListener('pointerleave', function () {
            if (desktop.matches && !(keyboardMode && dropdown.contains(document.activeElement))) {
                closeTimer = setTimeout(function () { setOpen(false); }, 180);
            }
        });
        toggle.addEventListener('click', function (event) {
            event.preventDefault();
            // First click after hover keeps the menu open; next click closes it.
            setOpen(hoverOpened || !open);
        });
        dropdown.addEventListener('keydown', function (event) {
            keyboardMode = true;
            if (event.key === 'Escape') {
                if (open) { event.preventDefault(); event.stopPropagation(); setOpen(false); toggle.focus(); }
                return;
            }
            if (event.target === toggle && event.key === ' ') {
                event.preventDefault(); setOpen(!open); return;
            }
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
            event.preventDefault();
            var items = Array.prototype.slice.call(menu.querySelectorAll('a.dropdown-item'));
            if (!items.length) return;
            var index = items.indexOf(document.activeElement);
            setOpen(true);
            index = index < 0 ? (event.key === 'ArrowDown' ? 0 : items.length - 1) :
                (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            items[index].focus();
        });
        dropdown.addEventListener('focusout', function (event) {
            if (!dropdown.contains(event.relatedTarget)) setOpen(false);
        });
    });
    document.addEventListener('click', function (event) {
        navMenus.forEach(function (menu) { if (!menu.element.contains(event.target)) menu.close(); });
    });
    function closeNavMenus() { navMenus.forEach(function (menu) { menu.close(); }); }
    if (desktop.addEventListener) desktop.addEventListener('change', closeNavMenus);
    window.addEventListener('blur', closeNavMenus);
    document.querySelectorAll('.navbar-collapse').forEach(function (element) {
        element.addEventListener('hide.bs.collapse', closeNavMenus);
        element.addEventListener('keydown', function (event) {
            var trigger = element.closest('.navbar').querySelector('.navbar-toggler');
            if (event.key !== 'Escape' || !trigger || trigger.getAttribute('aria-expanded') !== 'true' || !window.bootstrap) return;
            event.preventDefault();
            function closeMenu() {
                var collapse = window.bootstrap.Collapse.getInstance(element);
                if (collapse) collapse.hide();
                trigger.focus();
            }
            if (element.classList.contains('collapsing')) {
                element.addEventListener('shown.bs.collapse', closeMenu, { once: true });
            } else closeMenu();
        });
        element.addEventListener('hidden.bs.collapse', function () {
            if (element.contains(document.activeElement)) {
                element.closest('.navbar').querySelector('.navbar-toggler').focus();
            }
        });
    });

    // Company milestones use the original horizontal Owl Carousel structure.
    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.owlCarousel) {
        window.jQuery('.testimonial-carousel').owlCarousel({
            autoplay: false,
            smartSpeed: reducedMotion.matches ? 0 : 280,
            margin: 24,
            autoplayTimeout: 5500,
            autoplayHoverPause: true,
            dots: true,
            nav: false,
            onInitialized: function () {
                // This Owl version renders pagination as divs.
                window.jQuery('.milestone-carousel .owl-dot').each(function (index) {
                    this.setAttribute('role', 'button');
                    this.setAttribute('tabindex', '0');
                    this.setAttribute('aria-label', '跳转到第 ' + (index + 1) + ' 页大事记');
                    this.addEventListener('keydown', function (event) {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault(); this.click();
                        }
                    });
                });
            },
            loop: false,
            rewind: false,
            center: false,
            responsive: {
                0: { items: 1 },
                576: { items: 1 },
                768: { items: 2 },
                992: { items: 3 }
            }
        });
        window.jQuery('.testimonial-carousel').each(function () {
            var element = this;
            var carousel = window.jQuery(element);
            var inView = !('IntersectionObserver' in window);
            var hovering = false;
            function updatePlayback() {
                var instance = carousel.data('owl.carousel');
                if (instance) {
                    instance.settings.smartSpeed = reducedMotion.matches ? 0 : 280;
                    instance.options.smartSpeed = instance.settings.smartSpeed;
                }
                var play = !element.classList.contains('milestone-carousel') && inView && !hovering && !document.hidden && !reducedMotion.matches && !element.contains(document.activeElement);
                carousel.trigger(play ? 'play.owl.autoplay' : 'stop.owl.autoplay', play ? [5500] : []);
            }
            element.addEventListener('mouseenter', function () { hovering = true; updatePlayback(); });
            element.addEventListener('mouseleave', function () { hovering = false; updatePlayback(); });
            element.addEventListener('focusin', updatePlayback);
            element.addEventListener('focusout', function () { setTimeout(updatePlayback, 0); });
            document.addEventListener('visibilitychange', updatePlayback);
            if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', updatePlayback);
            if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) {
                inView = entries[0].isIntersecting;
                updatePlayback();
            }, { threshold: 0.1 }).observe(element);
            updatePlayback();
        });
    }

    // No WOW or counting animations. All copy stays available in the document.
    var pending = [];
    var observer;
    function revealAll() {
        pending.forEach(function (element) {
            element.classList.remove('is-pending');
            element.classList.add('is-visible');
        });
        if (observer) observer.disconnect();
    }
    if (!reducedMotion.matches && 'IntersectionObserver' in window) {
        observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.remove('is-pending');
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0, rootMargin: '0px 0px 32px 0px' });
        document.querySelectorAll('body:not(.homepage) > .container-fluid.wow').forEach(function (element) {
            if (element.getBoundingClientRect().top < window.innerHeight || element.classList.contains('bg-dark')) return;
            element.classList.add('presentation-reveal', 'is-pending');
            pending.push(element);
            observer.observe(element);
        });
        document.addEventListener('focusin', function (event) {
            var parent = event.target.closest('.is-pending');
            if (parent) { parent.classList.remove('is-pending'); observer.unobserve(parent); }
        });
    }
    if (reducedMotion.addEventListener) {
        reducedMotion.addEventListener('change', function () { if (reducedMotion.matches) revealAll(); });
    }
    window.addEventListener('beforeprint', revealAll);
    var topButton = document.querySelector('.back-to-top');
    if (topButton) {
        topButton.setAttribute('aria-label', '\u8fd4\u56de\u9876\u90e8');
        function updateTopButton() { topButton.style.display = window.scrollY > 480 ? 'inline-flex' : 'none'; }
        window.addEventListener('scroll', updateTopButton, { passive: true });
        updateTopButton();
        topButton.addEventListener('click', function (event) {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
        });
    }
}());
