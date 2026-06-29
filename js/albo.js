// js/albo.js
// Gestisce caricamento dati, filtri, ordinamento, export CSV, stampa e admin in sessione.

(function () {
  let ALBO_DATA = {};
  let currentEvent = null;
  let sortAsc = true;

  // Utility per download file client-side
  function downloadBlob(filename, content, type = 'application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  // Carica dati JSON
  function loadData() {
    if (Object.keys(ALBO_DATA).length) {
      return Promise.resolve(ALBO_DATA);
    }

    return fetch('../data/albo.json')
      .then(res => {
        if (!res.ok) {
          throw new Error('Errore nel caricamento dei dati');
        }

        return res.json();
      })
      .then(data => {
        ALBO_DATA = data || {};
        return ALBO_DATA;
      });
  }

  // Popola select eventi
  function populateEventSelect() {
    const sel = document.getElementById('event-select');
    if (!sel) return;

    sel.innerHTML = '';

    const events = Object.keys(ALBO_DATA);

    if (!events.length) {
      sel.innerHTML = '<option>—</option>';
      return;
    }

    events.forEach(eventName => {
      const opt = document.createElement('option');
      opt.value = eventName;
      opt.textContent = eventName;
      sel.appendChild(opt);
    });

    sel.onchange = onEventChange;
    sel.value = events[0];

    onEventChange();
  }

  // Rendering tabella storico completo per evento selezionato
  function renderTable() {
    const tbody = document.querySelector('#albo-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!currentEvent || !ALBO_DATA[currentEvent]) {
      tbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="4">Seleziona un evento</td>
        </tr>
      `;
      return;
    }

    const searchEl = document.getElementById('search-input');
    const search = searchEl ? (searchEl.value || '').trim().toLowerCase() : '';

    const rows = [];

    Object.keys(ALBO_DATA[currentEvent]).forEach(year => {
      const risultatiAnno = ALBO_DATA[currentEvent][year] || [];

      risultatiAnno.forEach(r => {
        rows.push({
          year: year,
          pos: r.pos,
          name: r.name,
          note: r.note || ''
        });
      });
    });

    const filtered = rows.filter(r => {
      if (!search) return true;

      const text = `${r.year || ''} ${r.pos || ''} ${r.name || ''} ${r.note || ''}`.toLowerCase();
      return text.includes(search);
    });

    filtered.sort((a, b) => {
      const ya = Number(a.year) || 0;
      const yb = Number(b.year) || 0;

      // Prima ordino per anno decrescente
      if (yb !== ya) {
        return yb - ya;
      }

      // Poi per posizione
      const pa = Number(a.pos) || 0;
      const pb = Number(b.pos) || 0;

      return sortAsc ? pa - pb : pb - pa;
    });

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="4">Nessun risultato</td>
        </tr>
      `;
      return;
    }

    let lastYear = null;

    filtered.forEach(r => {
      // Inserisce una riga separatrice ogni volta che cambia l'anno
      if (r.year !== lastYear) {
        const yearRow = document.createElement('tr');
        yearRow.classList.add('year-separator');

        const yearCell = document.createElement('td');
        yearCell.setAttribute('colspan', '4');
        yearCell.textContent = `${r.year}`;

        yearRow.appendChild(yearCell);
        tbody.appendChild(yearRow);

        lastYear = r.year;
      }

      // Riga normale del risultato
      const tr = document.createElement('tr');

      const posizione = Number(r.pos);

      // Classi per podio
      if (posizione === 1) {
        tr.classList.add('rank-gold');
      } else if (posizione === 2) {
        tr.classList.add('rank-silver');
      } else if (posizione === 3) {
        tr.classList.add('rank-bronze');
      }

      // Colonna Anno
      const tdYear = document.createElement('td');
      tdYear.setAttribute('data-label', 'Anno');
      tdYear.textContent = r.year || '';

      // Colonna Posizione
      const tdPos = document.createElement('td');
      tdPos.setAttribute('data-label', 'Posizione');
      tdPos.textContent = r.pos || '';

      // Colonna Nome
      const tdName = document.createElement('td');
      tdName.setAttribute('data-label', 'Nome');
      tdName.textContent = r.name || '';

      // Colonna Note
      const tdNote = document.createElement('td');
      tdNote.setAttribute('data-label', 'Note');
      tdNote.textContent = r.note || '';

      tr.appendChild(tdYear);
      tr.appendChild(tdPos);
      tr.appendChild(tdName);
      tr.appendChild(tdNote);

      tbody.appendChild(tr);
    });
  }

  // Cambio evento
  function onEventChange() {
    const sel = document.getElementById('event-select');
    currentEvent = sel ? sel.value : null;

    renderTable();
    updateEventLinks();
  }

  // Ordinamento toggle
  function toggleSort() {
    sortAsc = !sortAsc;

    const btn = document.getElementById('sort-btn');

    if (btn) {
      btn.textContent = `Ordina posizioni ${sortAsc ? '⇧' : '⇩'}`;
    }

    renderTable();
  }

  // Export CSV storico
  function exportCSV() {
    if (!currentEvent) {
      return alert('Seleziona evento prima di esportare.');
    }

    const rows = [];

    Object.keys(ALBO_DATA[currentEvent]).forEach(year => {
      const risultatiAnno = ALBO_DATA[currentEvent][year] || [];

      risultatiAnno.forEach(r => {
        rows.push({
          year: year,
          pos: r.pos,
          name: r.name,
          note: r.note || ''
        });
      });
    });

    if (!rows.length) {
      return alert('Nessun dato da esportare.');
    }

    const header = ['Anno', 'Posizione', 'Nome', 'Note'];
    const lines = [header.join(',')];

    rows.forEach(r => {
      const vals = [r.year || '', r.pos || '', r.name || '', r.note || ''].map(v => {
        const s = String(v).replace(/"/g, '""');
        return s.includes(',') || s.includes('"') ? `"${s}"` : s;
      });

      lines.push(vals.join(','));
    });

    const filename = `albo-${slug(currentEvent)}-storico.csv`;
    downloadBlob(filename, lines.join('\n'), 'text/csv;charset=utf-8;');
  }

  // Stampa
  function doPrint() {
    window.print();
  }

  // Admin in sessione: mostra/nascondi pannello
  function toggleAdmin() {
    const panel = document.getElementById('admin-panel');
    if (!panel) return;

    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }

  // Aggiungi record in memoria
  function adminAdd(e) {
    e.preventDefault();

    if (!currentEvent) {
      return alert('Seleziona un evento per aggiungere un risultato.');
    }

    const yearInput = document.getElementById('admin-year');
    const posInput = document.getElementById('admin-pos');
    const nameInput = document.getElementById('admin-name');
    const noteInput = document.getElementById('admin-note');

    const year = yearInput ? yearInput.value.trim() : '';
    const pos = posInput ? posInput.value : '';
    const name = nameInput ? nameInput.value.trim() : '';
    const note = noteInput ? noteInput.value.trim() : '';

    if (!year) {
      return alert('Inserisci un anno.');
    }

    if (!name) {
      return alert('Inserisci un nome.');
    }

    const newEntry = {
      pos: Number(pos) || null,
      name: name,
      note: note
    };

    ALBO_DATA[currentEvent][year] = ALBO_DATA[currentEvent][year] || [];
    ALBO_DATA[currentEvent][year].push(newEntry);

    renderTable();

    const adminForm = document.getElementById('admin-form');
    if (adminForm) {
      adminForm.reset();
    }
  }

  // Scarica JSON aggiornato
  function downloadUpdatedJSON() {
    const filename = 'albo-updated.json';
    downloadBlob(filename, JSON.stringify(ALBO_DATA, null, 2), 'application/json;charset=utf-8;');
  }

  // Slug utility per filename
  function slug(str) {
    return String(str)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');
  }

  // Aggiorna link diretti, se presenti
  function updateEventLinks() {
    const el = document.getElementById('current-event-link');

    if (el && currentEvent) {
      el.href = `${slug(currentEvent)}.html`;
      el.textContent = currentEvent;
    }
  }

  // Inizializzazione UI
  function attachUI() {
    const sortBtn = document.getElementById('sort-btn');
    if (sortBtn) sortBtn.addEventListener('click', toggleSort);

    const exportBtn = document.getElementById('export-csv');
    if (exportBtn) exportBtn.addEventListener('click', exportCSV);

    const printBtn = document.getElementById('print-btn');
    if (printBtn) printBtn.addEventListener('click', doPrint);

    const openAdmin = document.getElementById('open-admin');
    if (openAdmin) openAdmin.addEventListener('click', toggleAdmin);

    const adminForm = document.getElementById('admin-form');
    if (adminForm) adminForm.addEventListener('submit', adminAdd);

    const downloadJsonBtn = document.getElementById('download-json');
    if (downloadJsonBtn) downloadJsonBtn.addEventListener('click', downloadUpdatedJSON);

    const search = document.getElementById('search-input');
    if (search) search.addEventListener('input', renderTable);
  }

  // Init pagina albo principale
  function initAlboPage() {
    attachUI();

    loadData()
      .then(() => populateEventSelect())
      .catch(err => {
        console.error(err);

        const tbody = document.querySelector('#albo-table tbody');

        if (tbody) {
          tbody.innerHTML = `
            <tr class="empty-row">
              <td colspan="4">Errore nel caricamento dei dati</td>
            </tr>
          `;
        }
      });
  }

  // Init per eventuale pagina evento singolo
  function initEventPage(eventKey, tableId = 'albo-table') {
    const table = document.getElementById(tableId);
    if (!table) return;

    attachUI();

    loadData()
      .then(() => {
        if (!ALBO_DATA[eventKey]) {
          const tbody = table.querySelector('tbody');

          if (tbody) {
            tbody.innerHTML = `
              <tr class="empty-row">
                <td colspan="4">Nessun dato per questo evento</td>
              </tr>
            `;
          }

          return;
        }

        currentEvent = eventKey;
        renderTable();
      })
      .catch(err => {
        console.error(err);

        const tbody = table.querySelector('tbody');

        if (tbody) {
          tbody.innerHTML = `
            <tr class="empty-row">
              <td colspan="4">Errore nel caricamento dei dati</td>
            </tr>
          `;
        }
      });
  }

  // API pubbliche
  window.initAlboPage = initAlboPage;
  window.initEventPage = initEventPage;

})();
