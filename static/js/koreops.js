(function () {
    'use strict';

    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var controllers = [];
    var transitions = new WeakMap();
    function reveal(element) {
        if (!element.animate || motion.matches) return;
        var previous = transitions.get(element);
        if (previous) previous.cancel();
        transitions.set(element, element.animate([
            { opacity: 0, transform: 'translateY(12px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 360, easing: 'cubic-bezier(.2,.7,.2,1)' }));
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
            current = index;
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
            reveal(root.querySelector('.koreops-flow-copy'));
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
            });
        });
        note.textContent = '本机模式：Linux / Windows 主机安装 Agent，统一管理版本、在线状态与执行能力。';
    });

    // Entrance animations never hide content: no script, observer or motion support is required to read it.
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                if (!motion.matches) entry.target.classList.add('koreops-entered');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12 });
        document.querySelectorAll('.koreops-topology, .koreops-intro-panel, .koreops-feature-visual, .koreops-capability-card, .koreops-patch-steps li, .koreops-page .koreops-section-heading, .koreops-page .koreops-challenge-card, .koreops-page .koreops-control-card, .koreops-page .koreops-scenario-card').forEach(function (target) {
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
    function motionChanged() { controllers.forEach(function (update) { update(); }); }
    if (motion.addEventListener) motion.addEventListener('change', motionChanged);
    else if (motion.addListener) motion.addListener(motionChanged);
}());
