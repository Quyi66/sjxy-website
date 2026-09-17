(function () {
    'use strict';
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var scenes = {
        'directory1.html': { name: 'LINUX SUPPORT', icon: 'fab fa-linux', center: 'Linux 运行平台', nodes: ['技术支持', '性能调优', '持续运维'], caption: '为企业核心系统提供稳定的技术支撑', kind: 'platform' },
        'directory2.html': { name: 'OPERATIONS & DEVELOPMENT', icon: 'fa fa-cogs', center: '自动化运维体系', nodes: ['运维支持', '技术咨询', '定制开发'], caption: '连接业务需求、运维流程与自动化工具', kind: 'pipeline' },
        'directory3.html': { name: 'CONTAINERS & CLOUD NATIVE', icon: 'fa fa-cubes', center: 'Kubernetes', nodes: ['应用部署', '容器编排', 'DevOps 协作'], caption: '从应用交付到容器管理，连接开发与运维', kind: 'cluster' },
        'directory4.html': { name: 'OPEN CLOUD PLATFORM', icon: 'fa fa-network-wired', center: 'OpenStack 私有云', nodes: ['计算资源池', 'Ceph 存储', '虚拟化网络'], caption: '统一计算、存储与网络资源', kind: 'platform' },
        'directory5.html': { name: 'CLOUD MIGRATION', icon: 'fa fa-cloud', center: '公有云迁移与支持', nodes: ['迁移评估', '方案实施', '运维与代维'], caption: '从现有环境到云端，提供全流程技术支持', kind: 'migration' },
        'directory6.html': { name: 'KNOWLEDGE & TRAINING', icon: 'fa fa-graduation-cap', center: '团队能力建设', nodes: ['定制课程', '技术实践', '知识传递'], caption: '围绕团队需求，让技术与经验持续传递', kind: 'pipeline' }
    };
    function el(tag, cls, text) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text) node.textContent = text;
        return node;
    }
    function diagram(scene, href, catalogue) {
        var artwork = window.SJXYServiceScenes && window.SJXYServiceScenes(href, catalogue);
        var visual = el('div', 'showcase-visual');
        visual.setAttribute('role', 'img');
        visual.setAttribute('aria-label', scene.center + '：' + scene.nodes.join('、') + '。' + scene.caption);
        var header = el('div', 'showcase-visual-header');
        header.append(el('span', '', scene.name), el('span', '', '技术服务示意'));
        visual.append(header);
        if (artwork) {
            visual.dataset.scene = artwork.key;
            var art = el('div', 'showcase-artwork');
            art.innerHTML = artwork.markup;
            visual.append(art);
        } else {
            visual.append(el('p', 'showcase-artwork-fallback', scene.caption));
        }
        visual.append(el('p', 'showcase-visual-caption', scene.caption));
        return visual;
    }
    document.querySelectorAll('[data-service-showcase]').forEach(function (section, group) {
        var catalogue = section.dataset.serviceShowcase === 'catalogue';
        var products = section.dataset.serviceShowcase === 'products';
        var services = section.dataset.serviceShowcase === 'services';
        var source = section.querySelector('.container > .row');
        if (!source) return;
        var originals = catalogue ? source.querySelectorAll(':scope > .col-lg-4 > .rounded') : source.querySelectorAll('.service-item');
        var items = [];
        originals.forEach(function (card) {
            var link = card.querySelector('a[href]');
            var title = card.querySelector('h4');
            if (!link || !title) return;
            var scene = scenes[link.getAttribute('href')];
            if (!scene) return;
            var pointElements = card.querySelectorAll(catalogue ? '.d-flex > span' : '.showcase-points li');
            var points = pointElements.length ? Array.from(pointElements).map(function (point) {
                return point.textContent.trim();
            }) : scene.nodes;
            items.push({ title: title.textContent.trim(), href: link.getAttribute('href'), scene: scene,
                description: card.querySelector('p') ? card.querySelector('p').textContent.trim() : (card.querySelector('small') && card.querySelector('small').textContent.trim() !== '简单介绍' ? card.querySelector('small').textContent.trim() + ' ' : '') + scene.caption,
                points: points });
        });
        if (items.length < 2) return;
        var prefix = 'service-showcase-' + group;
        var root = el('div', 'service-showcase');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', services ? '技术与服务展示' : catalogue ? '服务目录展示' : products ? '产品和服务展示' : '主营业务展示');
        var tabs = el('div', 'showcase-tabs'); tabs.setAttribute('role', 'tablist');
        tabs.setAttribute('aria-label', services ? '选择技术与服务' : catalogue ? '选择服务目录' : products ? '选择产品和服务' : '选择主营业务');
        tabs.style.setProperty('--showcase-count', items.length);
        var stage = el('div', 'showcase-stage');
        var buttons = [], panels = [];
        items.forEach(function (item, index) {
            var button = el('button', 'showcase-tab'); button.type = 'button'; button.id = prefix + '-tab-' + index;
            button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', prefix + '-panel-' + index);
            button.append(el('span', 'showcase-tab-label', item.title));
            var track = el('span', 'showcase-track'); track.setAttribute('aria-hidden', 'true'); track.append(el('span'));
            button.append(track); tabs.append(button); buttons.push(button);
            var panel = el('div', 'showcase-panel'); panel.id = prefix + '-panel-' + index;
            panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', button.id); panel.tabIndex = 0;
            var copy = el('div', 'showcase-copy');
            copy.append(el('p', 'showcase-overline', item.scene.name), el('h3', '', item.title), el('p', 'showcase-description', item.description));
            var list = el('ul', 'showcase-points'); item.points.forEach(function (point) { list.append(el('li', '', point)); });
            var link = el('a', 'btn btn-outline-primary showcase-detail', '查看服务详情'); link.href = item.href;
            var arrow = el('span', '', '→'); arrow.setAttribute('aria-hidden', 'true'); link.append(arrow);
            copy.append(list, link); panel.append(diagram(item.scene, item.href, catalogue), copy); stage.append(panel); panels.push(panel);
        });
        var status = el('span', 'visually-hidden'); status.setAttribute('role', 'status');
        root.append(tabs, stage, status);
        source.before(root);
        source.classList.add('showcase-source'); source.hidden = true;
        var technologies = section.querySelector('.technology-list'); if (technologies) technologies.hidden = true;
        var current = 0, elapsed = 0, frame = 0, last = 0;
        var hovering = false, focusing = false, visible = !('IntersectionObserver' in window);
        var duration = 9000;
        function running() { return !motion.matches && !hovering && !focusing && visible && !document.hidden; }
        function update() {
            cancelAnimationFrame(frame); frame = 0; last = 0;
            root.classList.toggle('is-running', running());
            root.classList.toggle('is-animating', visible && !document.hidden && !motion.matches);
            if (running()) frame = requestAnimationFrame(tick);
        }
        function select(index, manual) {
            current = (index + items.length) % items.length; elapsed = 0;
            buttons.forEach(function (button, i) {
                var active = i === current;
                button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
                button.style.setProperty('--progress', active ? '0' : (i < current ? '1' : '0'));
                panels[i].hidden = !active;
            });
            // Manual switching restarts the timer and keeps automatic playback enabled.
            if (manual) { status.textContent = '已切换至' + items[current].title; }
            update();
        }
        function tick(now) {
            if (!running()) return;
            if (last) elapsed += now - last;
            last = now;
            buttons[current].style.setProperty('--progress', String(Math.min(elapsed / duration, 1)));
            if (elapsed >= duration) { select(current + 1, false); return; }
            frame = requestAnimationFrame(tick);
        }
        buttons.forEach(function (button, index) {
            button.addEventListener('click', function () { select(index, true); });
            button.addEventListener('keydown', function (event) {
                var target;
                if (event.key === 'ArrowRight') target = (index + 1) % items.length;
                if (event.key === 'ArrowLeft') target = (index - 1 + items.length) % items.length;
                if (event.key === 'Home') target = 0;
                if (event.key === 'End') target = items.length - 1;
                if (target === undefined) return;
                event.preventDefault(); select(target, true); buttons[target].focus();
            });
        });
        stage.addEventListener('pointerenter', function (event) { if (event.pointerType === 'mouse') { hovering = true; update(); } });
        stage.addEventListener('pointerleave', function () { hovering = false; update(); });
        // Keep content stable while someone is reading or following a detail link.
        stage.addEventListener('focusin', function () { focusing = true; update(); });
        stage.addEventListener('focusout', function () { setTimeout(function () { focusing = stage.contains(document.activeElement); update(); }, 0); });
        document.addEventListener('visibilitychange', update);
        if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting; update();
        }, { threshold: 0.15 }).observe(root);
        if (motion.addEventListener) motion.addEventListener('change', update);
        select(0, false);
    });
}());
