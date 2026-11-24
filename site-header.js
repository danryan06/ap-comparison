// Shared site header. Each page has <header class="site-header" data-page="..."></header>
// and loads this script; the header markup lives here once instead of in every page.
(function () {
  const ICONS = {
    browse: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    finder: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    compare: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    submit: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'
  };

  const NAV = [
    { page: 'index', href: 'index.html', label: 'Browse', icon: 'browse' },
    { page: 'finder', href: 'finder.html', label: 'Finder', icon: 'finder' },
    { page: 'compare', href: 'compare.html', label: 'Compare', icon: 'compare' }
  ];

  const ACTIONS = [
    { page: 'edit', href: 'edit.html', label: 'Edit AP', icon: 'edit', cls: 'nav-link-secondary' },
    { page: 'submit', href: 'submit.html', label: 'Submit AP', icon: 'submit', cls: 'nav-link-accent' }
  ];

  function icon(name) {
    return '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
  }

  function link(item, current, extraClass) {
    const active = item.page === current;
    const cls = ['nav-link', extraClass, active ? 'active' : ''].filter(Boolean).join(' ');
    return '<a href="' + item.href + '" class="' + cls + '" data-page="' + item.page + '"' +
      (active ? ' aria-current="page"' : '') + ' title="' + item.label + '">' +
      icon(item.icon) + '<span class="nav-text">' + item.label + '</span></a>';
  }

  function render(header) {
    const current = header.getAttribute('data-page') || '';
    header.innerHTML =
      '<div class="header-content">' +
        '<div class="header-left">' +
          '<a href="index.html" class="site-logo-link" aria-label="AP Comparison home">' +
            '<img src="logo.png" alt="" class="logo-image" />' +
            '<span class="logo-text">AP Comparison</span>' +
          '</a>' +
        '</div>' +
        '<nav class="header-nav" aria-label="Main">' +
          NAV.map(item => link(item, current)).join('') +
        '</nav>' +
        '<div class="header-right">' +
          '<div class="header-divider"></div>' +
          ACTIONS.map(item => link(item, current, item.cls)).join('') +
        '</div>' +
      '</div>';

    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.pageYOffset > 10);
    }, { passive: true });
  }

  document.querySelectorAll('header.site-header[data-page]').forEach(render);
})();
