// Fresh-take helpers: the provenance line on the detail page and the
// recent-changes list, both from site-meta.json (built from git history).
(function () {
  'use strict';

  let metaPromise = null;
  function meta() {
    if (!metaPromise) {
      metaPromise = fetch('site-meta.json', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null);
    }
    return metaPromise;
  }

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function fmtDate(iso) {
    const d = new Date(iso + 'T12:00:00');
    return isNaN(d) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function decorateDetail(entry, detailsEl, subtitleEl, slug) {
    // Provenance sits with the title: the datasheet buttons and the source note
    // move up under the subtitle, and the note gains the entry's last-edited date.
    const note = document.querySelector('.source-note');
    const actions = note && note.closest('.detail-actions');
    if (actions) subtitleEl.insertAdjacentElement('afterend', actions);
    meta().then(m => {
      const date = m && m.entries && m.entries[slug];
      if (!date || !note) return;
      const line = el('span', 'prov-date');
      line.appendChild(document.createTextNode('Entry last edited ' + fmtDate(date) + ' '));
      const h = el('a', null, '(history)');
      h.href = 'https://github.com/danryan06/ap-comparison/commits/main/ap_data.json';
      h.target = '_blank'; h.rel = 'noopener noreferrer';
      line.appendChild(h);
      line.appendChild(document.createTextNode('.'));
      note.appendChild(document.createTextNode(' '));
      note.appendChild(line);
    });

  }

  async function renderChanges(target) {
    const m = await meta();
    if (!m || !m.changes || !m.changes.length) return;
    const box = el('section', 'changes');
    box.setAttribute('aria-labelledby', 'changes-title');
    const h = el('h2', null, 'Recent changes');
    h.id = 'changes-title';
    box.appendChild(h);
    const list = el('ol', 'changes-list');
    m.changes.slice(0, 6).forEach(c => {
      const li = el('li');
      li.appendChild(el('time', null, fmtDate(c.date)));
      const a = el('a', null, c.title);
      a.href = 'https://github.com/danryan06/ap-comparison/pull/' + c.pr;
      a.target = '_blank'; a.rel = 'noopener noreferrer';
      li.appendChild(a);
      list.appendChild(li);
    });
    box.appendChild(list);
    target.appendChild(box);

    // One line near the top, so the latest change is visible without scrolling 200 rows
    const intro = document.querySelector('.container > .subtitle');
    if (intro) {
      const c = m.changes[0];
      const line = el('p', 'latest');
      line.appendChild(el('span', 'latest-label', 'Latest change'));
      line.appendChild(el('time', null, fmtDate(c.date)));
      const a = el('a', null, c.title);
      a.href = 'https://github.com/danryan06/ap-comparison/pull/' + c.pr;
      a.target = '_blank'; a.rel = 'noopener noreferrer';
      line.appendChild(a);
      const all = el('a', 'latest-all', 'All recent changes');
      all.href = '#changes-title';
      line.appendChild(all);
      intro.insertAdjacentElement('afterend', line);
    }
  }

  window.Fresh = { decorateDetail, renderChanges };
})();
