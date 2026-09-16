(function () {
    'use strict';
    var dialog = document.querySelector('.certificate-dialog');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    var opener;
    var preview = dialog.querySelector('.certificate-full');
    var original = dialog.querySelector('.certificate-original');
    document.querySelectorAll('[data-certificate]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            opener = link;
            dialog.querySelector('#certificate-title').textContent = link.dataset.title;
            preview.src = link.href;
            preview.alt = link.querySelector('img').alt;
            original.href = link.href;
            dialog.showModal();
        });
    });
    dialog.addEventListener('close', function () {
        if (opener) opener.focus();
    });
    dialog.addEventListener('click', function (event) {
        if (event.target !== dialog) return;
        var bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
}());
