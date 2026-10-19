// ---------- Proteção: só entra logado ----------
if (!getToken()) location.href = 'login.html';

// ---------- Elementos da página ----------
const searchForm = document.getElementById('search-form');
const results = document.getElementById('results');
const libraryList = document.getElementById('library-list');
const filterStatus = document.getElementById('filter-status');
const filterType = document.getElementById('filter-type');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout');

// ---------- Estado ----------
let lastResults = [];
let library = [];

const STATUS_LABELS = {
  want: 'Quero ver/jogar',
  in_progress: 'Em andamento',
  done: 'Concluído',
};

// ---------- Funções auxiliares ----------
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ---------- Chamadas à API ----------
async function searchMedia(query, type) {
  return request(`/search?q=${encodeURIComponent(query)}&type=${type}`);
}

async function loadLibrary() {
  libraryList.innerHTML = '<p>Carregando biblioteca...</p>';
  try {
    library = await request('/library');
    renderLibrary();
  } catch (err) {
    libraryList.innerHTML = `<p>Não foi possível carregar: ${escapeHtml(err.message)}</p>`;
  }
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
      </article>`,
    )
    .join('');
}

function renderLibrary() {
  const status = filterStatus.value;
  const type = filterType.value;

  const filtered = library.filter(
    (item) => (!status || item.status === status) && (!type || item.type === type),
  );

  if (!filtered.length) {
    libraryList.innerHTML = '<p>Nenhum item aqui ainda.</p>';
    return;
  }

  libraryList.innerHTML = filtered
    .map((item) => {
      const statusOptions = Object.entries(STATUS_LABELS)
        .map(
          ([value, label]) =>
            `<option value="${value}" ${item.status === value ? 'selected' : ''}>${label}</option>`,
        )
        .join('');
      const ratingOptions = ['<option value="">Sem nota</option>']
        .concat(
          Array.from({ length: 10 }, (_, i) => i + 1).map(
            (n) => `<option value="${n}" ${item.rating === n ? 'selected' : ''}>${n}</option>`,
          ),
        )
        .join('');

      return `
      <article class="card">
        <img src="${item.posterUrl || ''}" alt="${escapeHtml(item.title)}" loading="lazy">
        <h3>${escapeHtml(item.title)}</h3>
        <select data-action="status" data-id="${item.id}">${statusOptions}</select>
        <select data-action="rating" data-id="${item.id}">${ratingOptions}</select>
        <textarea data-action="review" data-id="${item.id}" maxlength="1000" placeholder="Escreva sua review...">${escapeHtml(item.review || '')}</textarea>
        <button class="btn-danger" data-action="remove" data-id="${item.id}">Remover</button>
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

// Adicionar à biblioteca
results.addEventListener('click', async (e) => {
  const button = e.target.closest('button[data-index]');
  if (!button) return;

  const item = lastResults[Number(button.dataset.index)];
  button.disabled = true;

  try {
    const created = await request('/library', {
      method: 'POST',
      body: JSON.stringify({
        externalId: item.externalId,
        type: item.type,
        title: item.title,
        posterUrl: item.posterUrl,
        genres: item.genres,
      }),
    });
    library.unshift(created);
    renderLibrary();
    loadStats();
  } catch (err) {
    alert(err.message);
  } finally {
    button.disabled = false;
  }
});

// Mudar status ou nota
libraryList.addEventListener('change', async (e) => {
  const { action, id } = e.target.dataset;
  if (!action) return;

  const item = library.find((i) => i.id === Number(id));
  if (!item) return;

  let body;
  if (action === 'status') body = { status: e.target.value };
  else if (action === 'rating') body = { rating: e.target.value ? Number(e.target.value) : null };
  else if (action === 'review') body = { review: e.target.value.trim() || null };
  else return;

  try {
    const updated = await request(`/library/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    Object.assign(item, updated);
  } catch (err) {
    alert(err.message);
  }
  renderLibrary();
  loadStats();
});

// Remover
libraryList.addEventListener('click', async (e) => {
  const button = e.target.closest('button[data-action="remove"]');
  if (!button) return;

  const id = Number(button.dataset.id);
  try {
    await request(`/library/${id}`, { method: 'DELETE' });
    library = library.filter((i) => i.id !== id);
    renderLibrary();
    loadStats();
  } catch (err) {
    alert(err.message);
  }
});

// Filtros
filterStatus.addEventListener('change', renderLibrary);
filterType.addEventListener('change', renderLibrary);

// Me surpreenda
const surpriseBtn = document.getElementById('surprise');
const surpriseResult = document.getElementById('surprise-result');
const TYPE_NAMES = { movie: 'Filme', tv: 'Série', game: 'Jogo' };

surpriseBtn.addEventListener('click', () => {
  const wanted = library.filter((i) => i.status === 'want');
  if (!wanted.length) {
    surpriseResult.textContent = 'Você ainda não tem itens em "Quero ver/jogar".';
    return;
  }
  const pick = wanted[Math.floor(Math.random() * wanted.length)];
  surpriseResult.textContent = `Que tal: ${pick.title} (${TYPE_NAMES[pick.type]})?`;
});

// Sair
logoutBtn.addEventListener('click', logout);

// ---------- Início ----------
const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
if (savedUser) userName.textContent = `Olá, ${savedUser.name}`;
loadLibrary();
