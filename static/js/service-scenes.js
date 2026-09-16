/* Purpose-built vector scenes. All numbers and diagrams are illustrative. */
(function () {
    'use strict';
    function text(x, y, value, cls, anchor) {
        return '<text x="' + x + '" y="' + y + '" class="' + (cls || '') + '" text-anchor="' + (anchor || 'start') + '">' + value + '</text>';
    }
    function box(x, y, w, h, cls, r) {
        return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r === undefined ? 8 : r) + '" class="' + (cls || 'scene-box') + '"/>';
    }
    function path(d, cls) { return '<path d="' + d + '" class="' + (cls || 'scene-line') + '"/>'; }
    function circle(x, y, r, cls) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" class="' + (cls || 'scene-box') + '"/>'; }
    function group(body, cls, delay) { return '<g class="' + cls + '" style="--delay:' + (delay || 0) + 's">' + body + '</g>'; }
    function flow(d, delay) { return group(path(d, 'scene-route') + path(d, 'scene-flow'), 'scene-motion scene-flow-group', delay); }
    function server(x, y) {
        var s = '';
        for (var i = 0; i < 3; i++) s += box(x, y + i * 33, 100, 25) + circle(x + 14, y + 12 + i * 33, 3, 'scene-accent') + path('M' + (x + 30) + ' ' + (y + 12 + i * 33) + 'h55');
        return s;
    }
    var renderers = {
        linux: function () {
            var s = box(35, 35, 350, 260, 'scene-terminal') + box(35, 35, 350, 36, 'scene-soft');
            s += circle(54, 53, 4, 'scene-accent') + circle(69, 53, 4, 'scene-muted-fill') + circle(84, 53, 4, 'scene-muted-fill');
            s += text(109, 59, 'Linux / 系统巡检', 'scene-small');
            ['systemctl status','journalctl --follow','检查内核与服务','分析日志与性能'].forEach(function (line, i) {
                s += group(text(57, 107 + i * 42, (i < 2 ? '$ ' : '› ') + line, i < 2 ? 'scene-code' : ''), 'scene-motion scene-terminal-line', i * .8);
            });
            s += group(box(58, 263, 10, 17, 'scene-accent', 0), 'scene-motion scene-cursor');
            s += box(410, 65, 155, 95) + text(430, 92, '运行状态', 'scene-small');
            s += path('M425 128h20l8-18 12 33 12-45 10 30h60', 'scene-route');
            s += group(path('M425 128h20l8-18 12 33 12-45 10 30h60', 'scene-wave'), 'scene-motion scene-wave-group');
            s += box(410, 180, 155, 100) + text(430, 208, '持续优化', 'scene-small');
            [62,95,78].forEach(function (w, i) { s += box(430, 223 + i * 15, 110, 5, 'scene-track', 2) + group(box(430, 223 + i * 15, w, 5, 'scene-accent', 2), 'scene-motion scene-meter', i * .4); });
            return s;
        },
        containers: function () {
            var s = box(180, 22, 240, 52, 'scene-soft') + text(300, 55, 'Kubernetes 调度器', 'scene-title', 'middle');
            s += flow('M300 74v35H100v45 M300 109v45 M300 109h200v45');
            [35,225,415].forEach(function (x, i) {
                s += box(x, 155, 150, 139) + text(x + 75, 182, 'Worker 0' + (i + 1), '', 'middle');
                for (var p = 0; p < 4; p++) s += group(box(x + 22 + (p % 2) * 57, 201 + Math.floor(p / 2) * 38, 48, 28, 'scene-pod') + text(x + 46 + (p % 2) * 57, 221 + Math.floor(p / 2) * 38, 'Pod', 'scene-small', 'middle'), 'scene-motion scene-pod-deploy', (i + p) * .45);
            });
            s += text(300, 326, '分配应用 · 编排容器 · 弹性协作', 'scene-small', 'middle');
            return s;
        },
        infrastructure: function () {
            var s = '';
            [{y:235,t:'网络 · 虚拟化连接'},{y:145,t:'存储 · Ceph'},{y:55,t:'计算 · OpenStack'}].forEach(function (layer, i) {
                var d = 'M100 ' + layer.y + 'l200-32 200 32-200 32Z';
                var body = path('M100 ' + layer.y + 'v14l200 32 200-32v-14l-200 32Z', 'scene-layer-side') + path(d, 'scene-layer');
                body += text(300, layer.y + 6, layer.t, 'scene-layer-label', 'middle');
                s += group(body, 'scene-motion scene-layer-float', i * .7);
            });
            s += text(302, 319, '开放架构，构建企业私有云', '', 'middle');
            return s;
        },
        migration: function () {
            var s = box(25, 80, 150, 198) + text(100, 111, '现有环境', 'scene-title', 'middle') + server(50, 142);
            s += path('M425 137c-24-5-32-35-13-51 8-8 19-10 30-7 6-37 64-42 78-6 35-6 58 36 34 60-7 8-18 11-31 11H429', 'scene-cloud');
            s += text(482, 118, '公有云', 'scene-title', 'middle') + box(407, 177, 154, 102, 'scene-soft') + text(484, 211, '目标环境', '', 'middle') + text(484, 248, '应用 / 数据', 'scene-small', 'middle');
            s += flow('M177 174H398') + path('M386 167l12 7-12 7', 'scene-line');
            s += group(box(183, 161, 25, 25, 'scene-accent', 4), 'scene-motion scene-transfer');
            s += text(286, 139, '迁移通道', 'scene-small', 'middle');
            s += box(204, 227, 173, 35, 'scene-soft') + text(290, 251, '评估 → 迁移 → 验证', 'scene-small', 'middle');
            return s;
        },
        learning: function () {
            var s = box(229, 34, 323, 180) + box(242, 47, 297, 27, 'scene-soft', 4);
            s += text(259, 67, '动手实践 / LAB', 'scene-small') + text(259, 109, '$ learn → practice', 'scene-code');
            s += group(text(259, 145, '› 理解原理', '') + text(259, 179, '› 验证与复盘', ''), 'scene-motion scene-terminal-line');
            s += path('M337 214v20h103v-20 M316 236h147');
            s += path('M50 137Q112 117 172 146V293Q111 264 50 281Z M172 146Q208 126 246 137V281Q208 270 172 293Z', 'scene-book');
            [165,190,215,240].forEach(function (y) { s += path('M70 ' + y + 'q37-4 78 10'); });
            s += group(path('M172 146Q208 126 246 137V281Q208 270 172 293Z', 'scene-page'), 'scene-motion scene-page-turn');
            s += text(390, 284, '课程  +  实践  +  经验', '', 'middle');
            return s;
        },
        automation: function () {
            var s = text(300, 40, '把重复操作，交给自动化流程', 'scene-title', 'middle');
            s += flow('M85 114H515');
            ['问题接入','分析定位','脚本执行','结果验证'].forEach(function (v, i) {
                var x = 32 + i * 145;
                s += group(box(x, 80, 110, 74, 'scene-soft') + text(x + 55, 108, '0' + (i + 1), 'scene-small', 'middle') + text(x + 55, 134, v, '', 'middle'), 'scene-motion scene-step', i * .8);
            });
            s += box(64, 194, 472, 111, 'scene-terminal') + text(88, 224, 'AUTOMATION / 执行记录', 'scene-small');
            s += group(text(88, 255, '› 收集日志   →   执行任务', 'scene-code') + text(88, 283, '› 汇总结果   →   持续改进', 'scene-code'), 'scene-motion scene-terminal-line');
            return s;
        },
        delivery: function () {
            var infinity = 'M300 170C190 20 30 55 60 170S220 320 300 170 540 20 540 170 410 320 300 170';
            var s = path(infinity, 'scene-loop-track') + group(path(infinity, 'scene-loop-travel'), 'scene-motion scene-loop-group');
            s += text(166, 171, 'DEV', 'scene-big', 'middle') + text(166, 199, '开发与交付', 'scene-small', 'middle');
            s += text(435, 171, 'OPS', 'scene-big', 'middle') + text(435, 199, '运行与反馈', 'scene-small', 'middle');
            [[110,63,'代码'],[110,267,'构建'],[440,63,'部署'],[440,267,'观测']].forEach(function (v) { s += box(v[0] - 35, v[1] - 20, 80, 35) + text(v[0] + 5, v[1] + 4, v[2], '', 'middle'); });
            s += circle(300, 170, 26, 'scene-soft') + text(300, 177, '↔', 'scene-title', 'middle');
            return s;
        },
        resources: function () {
            var s = circle(300, 164, 117, 'scene-orbit');
            s += group(circle(300, 47, 7, 'scene-accent'), 'scene-motion scene-orbit-dot');
            s += circle(300, 164, 57, 'scene-soft') + text(300, 158, '统一资源池', 'scene-title', 'middle') + text(300, 184, 'RESOURCE POOL', 'scene-tiny', 'middle');
            [[63,119,'计算','CPU / VM'],[414,119,'存储','Ceph'],[228,265,'网络','VPC / VLAN']].forEach(function (v) {
                s += box(v[0], v[1], 123, 67) + text(v[0] + 61, v[1] + 28, v[2], '', 'middle') + text(v[0] + 61, v[1] + 52, v[3], 'scene-small', 'middle');
            });
            s += flow('M186 154H243 M357 154H414 M300 221V265');
            s += text(300, 24, '资源解耦 · 按需组合', '', 'middle');
            return s;
        },
        roadmap: function () {
            var route = 'M80 250H227V187H375V117H520V68';
            var s = path(route, 'scene-stair-route') + group(path(route, 'scene-stair-progress'), 'scene-motion scene-roadmap-group');
            [[80,250,'迁移评估'],[227,187,'立项咨询'],[375,117,'项目实施'],[520,68,'运维代维']].forEach(function (v, i) {
                s += group(circle(v[0], v[1], 19, 'scene-soft') + text(v[0], v[1] + 6, '0' + (i + 1), 'scene-small', 'middle'), 'scene-motion scene-step', i * .8);
                s += text(v[0], v[1] + 48, v[2], '', 'middle');
            });
            s += text(80, 55, '从规划到持续运营', 'scene-title') + text(80, 82, '每一步，都有专业支持', 'scene-small');
            return s;
        },
        growth: function () {
            var s = path('M55 286H550') + text(55, 38, '让知识成为团队的能力', 'scene-title');
            var heights = [62,107,155,202];
            ['理解','实践','协作','创新'].forEach(function (label, i) {
                var x = 76 + i * 123, h = heights[i];
                s += group(box(x, 286 - h, 76, h, i === 3 ? 'scene-accent' : 'scene-soft', 5), 'scene-motion scene-growth-bar', i * .6);
                s += text(x + 38, 314, label, '', 'middle') + text(x + 38, 273 - h, '0' + (i + 1), 'scene-small', 'middle');
            });
            s += group(path('M76 195L197 149 321 98 433 52', 'scene-growth-arrow'), 'scene-motion scene-growth-trace');
            return s;
        }
    };
    var business = {'directory1.html':'linux','directory2.html':'automation','directory3.html':'containers','directory4.html':'infrastructure','directory5.html':'migration','directory6.html':'learning'};
    var catalogue = {'directory2.html':'automation','directory3.html':'delivery','directory4.html':'resources','directory5.html':'roadmap','directory6.html':'growth'};
    window.SJXYServiceScenes = function (href, isCatalogue) {
        var key = (isCatalogue ? catalogue : business)[href];
        if (!renderers[key]) return null;
        return { key: key, markup: '<svg class="service-scene scene-' + key + '" viewBox="0 0 600 340" aria-hidden="true">' + renderers[key]() + '</svg>' };
    };
}());
