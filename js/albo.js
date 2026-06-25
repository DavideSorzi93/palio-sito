// js/albo.js
// Gestisce caricamento dati, filtri, ordinamento, export CSV, stampa e admin in sessione.

(function(){
  let ALBO_DATA = {};
  let currentEvent = null;
  let currentYear = null;
  let sortAsc = true;

  // Utility per download file (client-side)
  function downloadBlob(filename, content, type='application/json') {
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
    if (Object.keys(ALBO_DATA).length) return Promise.resolve(ALBO_DATA);
    return fetch('../data/albo.json')
      .then(res => {
        if (!res.ok) throw new Error('Errore nel caricamento dei dati');
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
    events.forEach((e) => {
      const opt = document.createElement('option');
      opt.value = e;
      opt.textContent = e;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', onEventChange);
    sel.value = events[0];
    onEventChange();
  }

  // Popola anni per evento selezionato mantenendo l'anno scelto se disponibile
function populateYearSelect() {
  const sel = document.getElementById('year-select');
  if (!sel) return;

  // Salvo l'anno attualmente selezionato prima di ricostruire la select
  const previousYear = currentYear || sel.value;

  sel.innerHTML = '';

  if (!currentEvent || !ALBO_DATA[currentEvent]) {
    sel.innerHTML = '<option>—</option>';
    currentYear = null;
    return;
  }

  const years = Object.keys(ALBO_DATA[currentEvent]).sort((a, b) => b - a);

  years.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    sel.appendChild(opt);
  });

  // Evita di aggiungere più volte lo stesso event listener
  sel.onchange = onYearChange;

  // Se l'anno precedente esiste anche nel nuovo evento, lo mantengo
  if (previousYear && years.includes(previousYear)) {
    sel.value = previousYear;
    currentYear = previousYear;
  } else {
    // Altrimenti uso il primo anno disponibile
    sel.value = years[0] || '';
    currentYear = sel.value || null;
  }

  renderTable();
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

  // Trasforma la struttura:
  // Evento -> Anno -> risultati
  // in una lista piatta con anche l'anno
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

  // Filtro ricerca
  const filtered = rows.filter(r => {
    if (!search) return true;

    const text = `${r.year || ''} ${r.pos || ''} ${r.name || ''} ${r.note || ''}`.toLowerCase();
    return text.includes(search);
  });

  // Ordinamento:
  // prima anno decrescente, poi posizione crescente/decrescente
  filtered.sort((a, b) => {
    const ya = Number(a.year) || 0;
    const yb = Number(b.year) || 0;

    if (yb !== ya) {
      return yb - ya; // anni dal più recente al più vecchio
    }

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

  filtered.forEach(r => {
    const tr = document.createElement('tr');

    const posizione = Number(r.pos);

    if (posizione === 1) {
      tr.classList.add('rank-gold');
    } else if (posizione === 2) {
      tr.classList.add('rank-silver');
    } else if (posizione === 3) {
      tr.classList.add('rank-bronze');
    }

    const tdYear = document.createElement('td');
    tdYear.setAttribute('data-label', 'Anno');
    tdYear.textContent = r.year || '';

    const tdPos = document.createElement('td');
    tdPos.setAttribute('data-label', 'Posizione');
    tdPos.textContent = r.pos || '';

    const tdName = document.createElement('td');
    tdName.setAttribute('data-label', 'Nome');
    tdName.textContent = r.name || '';

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
  
  // Event handlers
  function onEventChange() {
  const sel = document.getElementById('event-select');
  currentEvent = sel ? sel.value : null;
  renderTable();
  updateEventLinks();
 }
  
  function onYearChange() {
    const sel = document.getElementById('year-select');
    currentYear = sel ? sel.value : null;
    renderTable();
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

  // Export CSV
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
    if (!currentEvent || !currentYear) return alert('Seleziona evento e anno per aggiungere un risultato.');
    const pos = document.getElementById('admin-pos').value;
    const name = document.getElementById('admin-name').value.trim();
    const note = document.getElementById('admin-note').value.trim();
    if (!name) return alert('Inserisci un nome.');
    const newEntry = { pos: Number(pos) || null, name, note };
    ALBO_DATA[currentEvent][currentYear] = ALBO_DATA[currentEvent][currentYear] || [];
    ALBO_DATA[currentEvent][currentYear].push(newEntry);
    renderTable();
    document.getElementById('admin-form').reset();
  }

  // Scarica JSON aggiornato
  function downloadUpdatedJSON() {
    const filename = 'albo-updated.json';
    downloadBlob(filename, JSON.stringify(ALBO_DATA, null, 2), 'application/json;charset=utf-8;');
  }

  // Slug utility per filename
  function slug(str) {
    return String(str).toLowerCase().replace(/\s+/g,'-').replace(/[^\w\-]+/g,'');
  }

  // Aggiorna link diretti (se presenti)
  function updateEventLinks() {
    const el = document.getElementById('current-event-link');
    if (el && currentEvent) {
      el.href = `${slug(currentEvent)}.html`;
      el.textContent = currentEvent;
    }
  }

  // Inizializzazione UI: attach handlers
  function attachUI() {
    const sortBtn = document.getElementById('sort-btn'); if (sortBtn) sortBtn.addEventListener('click', toggleSort);
    const exportBtn = document.getElementById('export-csv'); if (exportBtn) exportBtn.addEventListener('click', exportCSV);
    const printBtn = document.getElementById('print-btn'); if (printBtn) printBtn.addEventListener('click', doPrint);
    const openAdmin = document.getElementById('open-admin'); if (openAdmin) openAdmin.addEventListener('click', toggleAdmin);
    const adminForm = document.getElementById('admin-form'); if (adminForm) adminForm.addEventListener('submit', adminAdd);
    const downloadJsonBtn = document.getElementById('download-json'); if (downloadJsonBtn) downloadJsonBtn.addEventListener('click', downloadUpdatedJSON);
    const search = document.getElementById('search-input'); if (search) search.addEventListener('input', renderTable);
  }

  // Init per pagina principale (multipla)
  function initAlboPage() {
    attachUI();
    loadData()
      .then(()=> populateEventSelect())
      .catch(err => {
        console.error(err);
        const tbody = document.querySelector('#albo-table tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="3">Errore nel caricamento dei dati</td></tr>';
      });
  }

  // Init per pagina evento singolo
  function initEventPage(eventKey, yearSelectId='year-select', tableId='albo-table'){
    // set IDs according to the page
    const yearSel = document.getElementById(yearSelectId);
    const table = document.getElementById(tableId);
    if (!yearSel || !table) return;
    attachUI();
    loadData().then(()=>{
      if (!ALBO_DATA[eventKey]){
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '<tr><td colspan="3">Nessun dato per questo evento</td></tr>';
        return;
      }
      currentEvent = eventKey;
      // populate years
      yearSel.innerHTML = '';
      const years = Object.keys(ALBO_DATA[eventKey]).sort((a,b)=>b-a);
      years.forEach(y=>{
        const opt = document.createElement('option'); opt.value = y; opt.textContent = y; yearSel.appendChild(opt);
      });
      yearSel.addEventListener('change', ()=>{ currentYear = yearSel.value; renderTable(); });
      yearSel.value = years[0] || '';
      currentYear = yearSel.value;
      renderTable();
    }).catch(err => {
      console.error(err);
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = '<tr><td colspan="3">Errore nel caricamento dei dati</td></tr>';
    });
  }

  // Esporta API pubblica
  window.initAlboPage = initAlboPage;
  window.initEventPage = initEventPage;

})();
