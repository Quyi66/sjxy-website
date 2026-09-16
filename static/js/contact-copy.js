(function () {
    'use strict';
    var defaultStatus = document.querySelector('.contact-copy-status');
    function fallbackCopy(value) {
        var field = document.createElement('textarea');
        var focused = document.activeElement;
        field.value = value;
        field.readOnly = true;
        field.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
        document.body.appendChild(field);
        field.select();
        var copied = false;
        try { copied = document.execCommand('copy'); }
        finally {
            field.remove();
            if (focused) focused.focus({ preventScroll: true });
        }
        return copied;
    }
    document.querySelectorAll('[data-copy-contact]').forEach(function (button) {
        var status = document.getElementById(button.getAttribute('aria-describedby')) || defaultStatus;
        var resetTimer;
        var original = button.innerHTML;
        button.addEventListener('click', async function () {
            var value = button.dataset.copyContact;
            var copied = false;
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(value);
                    copied = true;
                }
            } catch (error) { /* Try the local-file compatible fallback below. */ }
            if (!copied) {
                try { copied = fallbackCopy(value); } catch (error) { copied = false; }
            }
            clearTimeout(resetTimer);
            if (copied) {
                button.dataset.copied = 'true';
                button.textContent = button.dataset.copyLabel ? '已复制' + button.dataset.copyLabel : '已复制：' + value;
                if (status) status.textContent = button.dataset.copyLabel ? button.dataset.copyLabel + '已复制到剪贴板。' : '已复制：' + value;
                resetTimer = setTimeout(function () {
                    button.innerHTML = original;
                    delete button.dataset.copied;
                }, 2200);
            } else {
                if (status) status.textContent = '未能自动复制，请选中并手动复制：' + value;
                button.innerHTML = original;
                delete button.dataset.copied;
            }
        });
    });
}());
