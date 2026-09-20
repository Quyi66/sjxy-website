(function () {
    'use strict';

    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var controllers = [];
    var transitions = new WeakMap();
    var activeAnimations = new Set();
    function animate(element, frames, options) {
        if (!element || !element.animate || motion.matches || document.hidden) return;
        var previous = transitions.get(element);
        if (previous) previous.cancel();
        var animation = element.animate(frames, options);
        transitions.set(element, animation);
        activeAnimations.add(animation);
        function release() {
            activeAnimations.delete(animation);
            if (transitions.get(element) === animation) transitions.delete(element);
        }
        animation.addEventListener('finish', release);
        animation.addEventListener('cancel', release);
        return animation;
    }
    function reveal(element, delay) {
        return animate(element, [
            { opacity: 0, transform: 'translateY(12px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 300, delay: delay || 0, fill: 'backwards', easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
    function trace(element, delay, vertical) {
        return animate(element, [
            { opacity: 0, clipPath: vertical ? 'inset(0 0 100% 0)' : 'inset(0 100% 0 0)' },
            { opacity: 1, clipPath: 'inset(0 0 0 0)' }
        ], { duration: 280, delay: delay || 0, fill: 'backwards', easing: 'ease-out' });
    }

    document.querySelectorAll('[data-koreops-flow]').forEach(function (root) {
        var steps = Array.from(root.querySelectorAll('.koreops-workflow-list li'));
        var panel = root.querySelector('.koreops-flow-detail');
        var announcement = root.querySelector('[data-flow-announcement]');
        var current = 0;
        var focused = false;
        var visible = !('IntersectionObserver' in window);
        var hovering = false;
        var timer;
        var map = document.createElement('div');
        map.className = 'ko-flow-map';
        var list = root.querySelector('.koreops-workflow-list');
        list.before(map);
        map.appendChild(list);
        var hub = document.createElement('div');
        hub.className = 'ko-flow-hub';
        hub.setAttribute('aria-hidden', 'true');
        hub.innerHTML = '<span>全生命周期</span><strong>01</strong><small>发现 → 执行 → 留痕</small>';
        map.appendChild(hub);
        // Decorative paths follow the actual node positions, including font/layout changes.
        var svgNamespace = 'http://www.w3.org/2000/svg';
        var connectors = document.createElementNS(svgNamespace, 'svg');
        connectors.classList.add('ko-flow-connectors');
        connectors.setAttribute('aria-hidden', 'true');
        connectors.setAttribute('focusable', 'false');
        map.insertBefore(connectors, list);
        var routes = steps.map(function () {
            var base = document.createElementNS(svgNamespace, 'path');
            var highlight = document.createElementNS(svgNamespace, 'path');
            base.classList.add('ko-flow-route-base');
            highlight.classList.add('ko-flow-route-highlight');
            highlight.setAttribute('pathLength', '1');
            connectors.appendChild(base);
            connectors.appendChild(highlight);
            return { base: base, highlight: highlight };
        });
        function layoutRoutes() {
            var bounds = map.getBoundingClientRect();
            if (!bounds.width || !bounds.height) return;
            connectors.setAttribute('viewBox', '0 0 ' + bounds.width + ' ' + bounds.height);
            var points = steps.map(function (step) {
                var rect = step.getBoundingClientRect();
                return { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2 };
            });
            // All segments share one ellipse, so their position and tangent agree at every join.
            var centerX = bounds.width / 2;
            var centerY = bounds.height / 2;
            var radiusX = Math.max(1, Math.max.apply(null, points.map(function (point) { return Math.abs(point.x - centerX); })));
            var radiusY = Math.max(1, Math.max.apply(null, points.map(function (point) { return Math.abs(point.y - centerY); })));
            var anchors = points.map(function (point) {
                var angle = Math.atan2((point.y - centerY) / radiusY, (point.x - centerX) / radiusX);
                return { x: centerX + radiusX * Math.cos(angle), y: centerY + radiusY * Math.sin(angle), angle: angle };
            });
            routes.forEach(function (route, index) {
                var a = anchors[index];
                var b = anchors[(index + 1) % anchors.length];
                var sweep = (b.angle - a.angle + Math.PI * 2) % (Math.PI * 2);
                var path = 'M ' + a.x + ' ' + a.y + ' A ' + radiusX + ' ' + radiusY + ' 0 ' + (sweep > Math.PI ? 1 : 0) + ' 1 ' + b.x + ' ' + b.y;
                route.base.setAttribute('d', path);
                route.highlight.setAttribute('d', path);
            });
        }
        function updateRoutes(index, previous) {
            routes.forEach(function (route, i) {
                var incoming = i === (index + steps.length - 1) % steps.length;
                var reached = i < index || (index === 0 && incoming && previous === steps.length - 1);
                var active = incoming && reached;
                var pending = transitions.get(route.highlight);
                if (pending) pending.cancel();
                route.highlight.classList.toggle('is-reached', reached);
                route.highlight.classList.toggle('is-active', active);
                if (active && index !== previous) animate(route.highlight, [
                    { strokeDashoffset: 1 }, { strokeDashoffset: 0 }
                ], { duration: 420, easing: 'ease-out' });
            });
        }
        var buttons = steps.map(function (step, index) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'koreops-flow-step';
            while (step.firstChild) button.appendChild(step.firstChild);
            button.addEventListener('click', function () {
                show(index, true);
            });
            step.appendChild(button);
            return button;
        });

        function schedule() {
            window.clearTimeout(timer);
            var running = visible && !document.hidden && !motion.matches && !hovering && !focused;
            root.classList.toggle('is-playing', running);
            if (running) timer = window.setTimeout(function () {
                show((current + 1) % steps.length, false);
            }, 2000);
        }

        function show(index, announce) {
            var previous = current;
            current = index;
            updateRoutes(index, previous);
            map.style.setProperty('--flow-progress', ((index + 1) / steps.length * 100) + '%');
            hub.querySelector('strong').textContent = ('0' + (index + 1)).slice(-2);
            steps.forEach(function (step, i) {
                step.classList.toggle('is-current', i === current);
                step.classList.toggle('is-complete', i < current);
                buttons[i].setAttribute('aria-pressed', String(i === current));
            });
            var step = steps[current];
            var title = step.querySelector('strong').textContent;
            root.querySelector('[data-flow-count]').textContent = ('0' + (current + 1)).slice(-2) + ' / 08';
            root.querySelector('[data-flow-title]').textContent = title;
            root.querySelector('[data-flow-description]').textContent = step.dataset.detail;
            root.querySelector('[data-flow-evidence]').textContent = step.dataset.evidence;
            root.querySelector('.koreops-flow-symbol i').className = 'fa ' + step.dataset.icon;
            reveal(root.querySelector('[data-flow-title]'));
            reveal(root.querySelector('[data-flow-description]'), 45);
            reveal(root.querySelector('.koreops-flow-evidence'), 100);
            if (announce) announcement.textContent = title + '。' + step.dataset.detail;
            schedule();
        }

        // Pause while reading or focusing a node; resume when interaction ends.
        root.querySelectorAll('.koreops-workflow-list, .koreops-flow-copy').forEach(function (readingArea) {
            readingArea.addEventListener('mouseenter', function () { hovering = true; schedule(); });
            readingArea.addEventListener('mouseleave', function () { hovering = false; schedule(); });
        });
        root.addEventListener('focusin', function () {
            focused = true;
            schedule();
        });
        root.addEventListener('focusout', function (event) {
            focused = root.contains(event.relatedTarget);
            schedule();
        });
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
                schedule();
            }, { threshold: 0.15 }).observe(root);
        }
        document.addEventListener('visibilitychange', schedule);
        controllers.push(schedule);
        root.classList.add('is-enhanced');
        panel.hidden = false;
        show(0, false);
        layoutRoutes();
        if ('ResizeObserver' in window) {
            var routeObserver = new ResizeObserver(layoutRoutes);
            routeObserver.observe(map);
            steps.forEach(function (step) { routeObserver.observe(step); });
        } else window.addEventListener('resize', layoutRoutes);
    });

    document.querySelectorAll('[data-koreops-topology]').forEach(function (root) {
        var modes = root.querySelector('.koreops-topology-modes');
        var note = root.querySelector('[data-agent-note]');
        var hostModes = root.querySelectorAll('[data-host-mode]');
        hostModes.forEach(function (label) { label.hidden = false; });
        modes.hidden = false;
        note.setAttribute('role', 'status');
        note.setAttribute('aria-live', 'polite');
        modes.querySelectorAll('button').forEach(function (button) {
            button.addEventListener('click', function () {
                if (button.getAttribute('aria-pressed') === 'true') return;
                var hosts = root.querySelector('.koreops-topology-hosts');
                var previousTop = hosts.getBoundingClientRect().top;
                var relay = button.dataset.agentMode === 'relay';
                modes.querySelectorAll('button').forEach(function (item) {
                    item.setAttribute('aria-pressed', String(item === button));
                });
                root.querySelector('.koreops-relay-node').hidden = !relay;
                root.querySelector('.koreops-relay-link').hidden = !relay;
                hostModes.forEach(function (label) {
                    label.textContent = relay ? '跳板 Agent 代管' : '本机 Agent';
                });
                note.textContent = relay
                    ? '跳板代管：由在线 Agent 代管目标 IP，执行前校验通道状态与目标能力。'
                    : '本机模式：Linux / Windows 主机安装 Agent，统一管理版本、在线状态与执行能力。';
                var offset = previousTop - hosts.getBoundingClientRect().top;
                animate(hosts, [
                    { transform: 'translateY(' + offset + 'px)' },
                    { transform: 'translateY(0)' }
                ], { duration: 300, easing: 'cubic-bezier(.2,.7,.2,1)' });
                if (relay) {
                    reveal(root.querySelector('.koreops-relay-node'));
                    trace(root.querySelector('.koreops-relay-link'), 70, true);
                }
                reveal(note);
            });
        });
        note.textContent = '本机模式：Linux / Windows 主机安装 Agent，统一管理版本、在线状态与执行能力。';
    });

    // Keep native details semantics; only intercept activation when animation is available.
    document.querySelectorAll('.koreops-detail details').forEach(function (details) {
        var summary = details.querySelector('summary');
        var targetOpen = details.open;
        var expanding;
        function settle() {
            if (expanding) {
                expanding.onfinish = null;
                expanding.cancel();
                expanding = null;
            }
            details.open = targetOpen;
            details.style.height = '';
            details.style.overflow = '';
            summary.removeAttribute('aria-expanded');
        }
        summary.addEventListener('click', function (event) {
            if (motion.matches || !details.animate) return;
            event.preventDefault();
            var start = details.getBoundingClientRect().height;
            targetOpen = expanding ? !targetOpen : !details.open;
            if (expanding) { expanding.onfinish = null; expanding.cancel(); }
            details.style.height = '';
            details.open = targetOpen;
            var end = details.getBoundingClientRect().height;
            details.open = true;
            details.style.height = start + 'px';
            details.style.overflow = 'hidden';
            summary.setAttribute('aria-expanded', String(targetOpen));
            expanding = animate(details, [{ height: start + 'px' }, { height: end + 'px' }], {
                duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)'
            });
            if (!expanding) { settle(); return; }
            expanding.onfinish = settle;
            if (targetOpen) {
                Array.from(details.children).forEach(function (child) {
                    if (child !== summary) reveal(child, 35);
                });
            }
        });
        controllers.push(function () { if (expanding && (motion.matches || document.hidden)) settle(); });
        window.addEventListener('resize', function () { if (expanding) settle(); });
    });

    // Entrance animations never hide content: no script, observer or motion support is required to read it.
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                if (!motion.matches) {
                    if (entry.target.matches('[data-koreops-topology]')) {
                        entry.target.querySelectorAll('.ko-architecture-lanes > *, .ko-architecture-bridge, .ko-access-zone').forEach(function (part, index) {
                            if (part.matches('.ko-architecture-arrow')) {
                                trace(part, index * 85, window.matchMedia('(max-width: 767.98px)').matches);
                            } else reveal(part, index * 85);
                        });
                    } else if (entry.target.matches('.koreops-console')) {
                        reveal(entry.target.querySelector('.koreops-orbit-core'));
                        entry.target.querySelectorAll('.koreops-orbit-node').forEach(function (part, index) {
                            reveal(part, 100 + index * 90);
                        });
                    } else entry.target.classList.add('koreops-entered');
                }
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12 });
        document.querySelectorAll('.koreops-console, .koreops-topology, .koreops-intro-panel, .koreops-feature-visual, .koreops-capability-card, .koreops-patch-steps li, .koreops-page .koreops-section-heading, .koreops-page .koreops-challenge-card, .koreops-page .koreops-control-card, .koreops-page .koreops-scenario-card').forEach(function (target) {
            var siblings = Array.from(target.parentElement.children);
            target.style.setProperty('--ko-delay', (siblings.indexOf(target) % 4) * 65 + 'ms');
            observer.observe(target);
        });
    }

    // Highlight the section being read without changing focus or the URL.
    var pageNav = document.querySelector('.koreops-page .koreops-page-nav');
    if (pageNav) {
        var links = Array.from(pageNav.querySelectorAll('a[href^="#"]'));
        var sections = links.map(function (link) { return document.querySelector(link.getAttribute('href')); });
        var navUpdatePending = false;
        function updatePageNav() {
            navUpdatePending = false;
            var current = null;
            var scrollPadding = parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
            sections.forEach(function (section) {
                if (!section) return;
                // Native anchors combine the scroll container's padding and target's margin.
                var offset = scrollPadding + (parseFloat(window.getComputedStyle(section).scrollMarginTop) || 0);
                if (section.getBoundingClientRect().top <= offset + 1) current = section;
            });
            links.forEach(function (link, index) {
                if (current && sections[index] === current) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        }
        function schedulePageNavUpdate() {
            if (navUpdatePending) return;
            navUpdatePending = true;
            window.requestAnimationFrame(updatePageNav);
        }
        window.addEventListener('scroll', schedulePageNavUpdate, { passive: true });
        window.addEventListener('resize', schedulePageNavUpdate);
        window.addEventListener('load', schedulePageNavUpdate);
        window.addEventListener('hashchange', schedulePageNavUpdate);
        updatePageNav();
    }
    function motionChanged() {
        controllers.forEach(function (update) { update(); });
        if (motion.matches || document.hidden) activeAnimations.forEach(function (animation) { animation.cancel(); });
    }
    document.addEventListener('visibilitychange', motionChanged);
    if (motion.addEventListener) motion.addEventListener('change', motionChanged);
    else if (motion.addListener) motion.addListener(motionChanged);
}());
