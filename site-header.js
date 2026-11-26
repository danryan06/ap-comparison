// Shared site header. Each page has <header class="site-header" data-page="..."></header>
// and loads this script; the header markup lives here once instead of in every page.
// Layout and tab styling match switchcomparison.com; the family strip links the three sibling sites.
(function () {
  const NAV = [
    { page: 'index', href: 'index.html', label: 'Browse' },
    { page: 'finder', href: 'finder.html', label: 'Finder' },
    { page: 'compare', href: 'compare.html', label: 'Compare' },
    { page: 'edit', href: 'edit.html', label: 'Edit an AP' },
    { page: 'submit', href: 'submit.html', label: 'Submit an AP' }
  ];

  // The three sibling reference sites, shown as one family strip on every page.
  const FAMILY = [
    { key: 'ap', href: 'https://apcomparison.com', label: 'AP Comparison', icon: 'family/ap.png' },
    { key: 'switch', href: 'https://switchcomparison.com', label: 'Switch Comparison', icon: 'family/switch.png' },
    { key: 'antenna', href: 'https://antennacomparison.com', label: 'Antenna Comparison', icon: 'family/antenna.png' }
  ];
  const HERE = 'ap';

  function tab(item, current) {
    const active = item.page === current;
    return '<a href="' + item.href + '" class="tab' + (active ? ' on' : '') + '" data-page="' + item.page + '"' +
      (active ? ' aria-current="page"' : '') + '>' + item.label + '</a>';
  }

  function familyLink(item) {
    const here = item.key === HERE;
    return '<a class="fam' + (here ? ' here' : '') + '" href="' + (here ? 'index.html' : item.href) + '"' +
      (here ? ' aria-current="true"' : '') + '>' +
      '<img src="' + item.icon + '" alt="" width="18" height="18" />' + item.label + '</a>';
  }

  function render(header) {
    const current = header.getAttribute('data-page') || '';
    header.innerHTML =
      '<nav class="family" aria-label="Reference sites">' +
        '<div class="family-in">' + FAMILY.map(familyLink).join('') +
        '<span class="family-note">Vendor-sourced Wi-Fi and network references</span></div>' +
      '</nav>' +
      '<div class="header-content">' +
        '<div class="brand">' +
          '<a href="index.html" class="site-logo-link" aria-label="AP Comparison home">' +
            '<img src="logo.png" alt="" class="logo-image" />' +
            '<span class="logo-text">AP Comparison</span>' +
          '</a>' +
        '</div>' +
        '<div class="navrow">' +
          '<nav class="tabs" aria-label="Main">' + NAV.map(item => tab(item, current)).join('') + '</nav>' +
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
