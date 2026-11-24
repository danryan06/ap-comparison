// Shared site header. Each page has <header class="site-header" data-page="..."></header>
// and loads this script; the header markup lives here once instead of in every page.
// Layout and tab styling match switchcomparison.com so the sibling sites read as one family.
(function () {
  const NAV = [
    { page: 'index', href: 'index.html', label: 'Browse' },
    { page: 'finder', href: 'finder.html', label: 'Finder' },
    { page: 'compare', href: 'compare.html', label: 'Compare' },
    { page: 'edit', href: 'edit.html', label: 'Edit an AP' },
    { page: 'submit', href: 'submit.html', label: 'Submit an AP' }
  ];

  const SIBLINGS = [
    { href: 'https://switchcomparison.com', label: 'Switch Comparison' },
    { href: 'https://antennacomparison.com', label: 'Antenna Comparison' }
  ];

  function tab(item, current) {
    const active = item.page === current;
    return '<a href="' + item.href + '" class="tab' + (active ? ' on' : '') + '" data-page="' + item.page + '"' +
      (active ? ' aria-current="page"' : '') + '>' + item.label + '</a>';
  }

  function xlink(item) {
    return '<a class="xlink" href="' + item.href + '" target="_blank" rel="noopener">' + item.label +
      ' <span class="arr" aria-hidden="true">&#8599;</span></a>';
  }

  function render(header) {
    const current = header.getAttribute('data-page') || '';
    header.innerHTML =
      '<div class="header-content">' +
        '<div class="brand">' +
          '<a href="index.html" class="site-logo-link" aria-label="AP Comparison home">' +
            '<img src="logo.png" alt="" class="logo-image" />' +
            '<span class="logo-text">AP Comparison</span>' +
          '</a>' +
        '</div>' +
        '<div class="navrow">' +
          '<nav class="tabs" aria-label="Main">' + NAV.map(item => tab(item, current)).join('') + '</nav>' +
          SIBLINGS.map(xlink).join('') +
        '</div>' +
      '</div>';

    // On phones the tabs scroll sideways; fade the right edge while there is more to see.
    const row = header.querySelector('.navrow');
    const more = () => row.classList.toggle('more', row.scrollWidth - row.clientWidth - row.scrollLeft > 4);
    row.addEventListener('scroll', more, { passive: true });
    window.addEventListener('resize', more);
    more();
  }

  document.querySelectorAll('header.site-header[data-page]').forEach(render);
})();
