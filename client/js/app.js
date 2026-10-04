// ---------- Elementos da página ----------
const searchForm = document.getElementById('search-form');
const results = document.getElementById('results');
const libraryList = document.getElementById('library-list');
const filterStatus = document.getElementById('filter-status');
const filterType = document.getElementById('filter-type');

// ---------- Estado ----------
let lastResults = [];
let library = JSON.parse(localStorage.getItem('library')) || [];

const STATUS_LABELS = {
  want: 'Quero ver/jogar',
  in_progress: 'Em andamento',
  done: 'Concluído',
};

// ---------- Funções auxiliares ----------
function saveLibrary() {
  localStorage.setItem('library', JSON.stringify(library));
}

// Evita que um título com caracteres especiais quebre o HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


const API_URL = 'http://localhost:3000';

async function searchMedia(query, type) {
  const res = await fetch(
    `${API_URL}/search?q=${encodeURIComponent(query)}&type=${type}`
  );
  if (!res.ok) throw new Error(`Erro ${res.status} na busca.`);
  return res.json();
}


// ---------- Renderização ----------
function renderResults(items) {
  if (!items.length) {
    results.innerHTML = '<p>Nada encontrado.</p>';
    return;
  }
  results.innerHTML = items
    .map(
      (item, index) => `
      <article class="card">
        <img src="${item.posterUrl}" alt="${escapeHtml(item.title)}" loading="lazy">
        <h3>${escapeHtml(item.title)}</h3>
        <button data-index="${index}">Adicionar</button>
      </article>`
    )
    .join('');
}

function renderLibrary() {
  const status = filterStatus.value;
  const type = filterType.value;

  const filtered = library.filter(
    (item) => (!status || item.status === status) && (!type || item.type === type)
  );

  if (!filtered.length) {
    libraryList.innerHTML = '<p>Nenhum item aqui ainda.</p>';
    return;
  }

  libraryList.innerHTML = filtered
    .map((item) => {
      const key = `${item.type}-${item.externalId}`;
      const statusOptions = Object.entries(STATUS_LABELS)
        .map(
          ([value, label]) =>
            `<option value="${value}" ${item.status === value ? 'selected' : ''}>${label}</option>`
        )
        .join('');
      const ratingOptions = ['<option value="">Sem nota</option>']
        .concat(
          Array.from({ length: 10 }, (_, i) => i + 1).map(
            (n) => `<option value="${n}" ${item.rating === n ? 'selected' : ''}>${n}</option>`
          )
        )
        .join('');

      return `
      <article class="card">
        <img src="${item.posterUrl}" alt="${escapeHtml(item.title)}" loading="lazy">
        <h3>${escapeHtml(item.title)}</h3>
        <select data-action="status" data-key="${key}">${statusOptions}</select>
        <select data-action="rating" data-key="${key}">${ratingOptions}</select>
        <button class="btn-danger" data-action="remove" data-key="${key}">Remover</button>
      </article>`;
    })
    .join('');
}

// ---------- Eventos ----------
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('query').value.trim();
  const type = document.getElementById('type').value;

  results.innerHTML = '<p>Carregando...</p>';

  try {
    lastResults = await searchMedia(query, type);
    renderResults(lastResults);
  } catch (err) {
    results.innerHTML = `<p>Algo deu errado: ${escapeHtml(err.message)}</p>`;
  }
});

// Clique em "Adicionar" nos resultados
results.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-index]');
  if (!button) return;

  const item = lastResults[Number(button.dataset.index)];
  const exists = library.some(
    (i) => i.externalId === item.externalId && i.type === item.type
  );

  if (exists) {
    alert('Esse item já está na sua biblioteca!');
    return;
  }

  library.push({ ...item, status: 'want', rating: null, createdAt: Date.now() });
  saveLibrary();
  renderLibrary();
});

// Mudar status/nota na biblioteca
libraryList.addEventListener('change', (e) => {
  const { action, key } = e.target.dataset;
  if (!action) return;

  const item = library.find((i) => `${i.type}-${i.externalId}` === key);
  if (!item) return;

  if (action === 'status') item.status = e.target.value;
  if (action === 'rating') item.rating = e.target.value ? Number(e.target.value) : null;

  saveLibrary();
  renderLibrary();
});

// Remover da biblioteca
libraryList.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-action="remove"]');
  if (!button) return;

  library = library.filter((i) => `${i.type}-${i.externalId}` !== button.dataset.key);
  saveLibrary();
  renderLibrary();
});

// Filtros
filterStatus.addEventListener('change', renderLibrary);
filterType.addEventListener('change', renderLibrary);

// ---------- Início ----------
renderLibrary();