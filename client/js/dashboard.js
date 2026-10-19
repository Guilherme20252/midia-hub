const TYPE_LABELS = { movie: 'Filmes', tv: 'Séries', game: 'Jogos' };
const STATUS_NAMES = {
  want: 'Quero ver/jogar',
  in_progress: 'Em andamento',
  done: 'Concluído',
};

let typeChart = null;
let statusChart = null;

function drawChart(current, canvasId, kind, labels, values, title) {
  const ctx = document.getElementById(canvasId);
  if (current) current.destroy();

  const css = getComputedStyle(document.documentElement);
  const text = css.getPropertyValue('--text').trim();
  const muted = css.getPropertyValue('--muted').trim();

  return new Chart(ctx, {
    type: kind,
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ['#7c5cff', '#4ea1ff', '#35c28a'],
        },
      ],
    },
    options: {
      plugins: {
        title: { display: true, text: title, color: text },
        legend: { labels: { color: text } },
      },
      scales:
        kind === 'bar'
          ? {
              x: { ticks: { color: muted } },
              y: { ticks: { color: muted, precision: 0 }, beginAtZero: true },
            }
          : {},
    },
  });
}

async function loadStats() {
  try {
    const s = await request('/stats');

    document.getElementById('stat-total').textContent = s.total;
    document.getElementById('stat-avg').textContent = s.averageRating ?? '-';
    document.getElementById('stat-done').textContent = s.byStatus.done;

    typeChart = drawChart(
      typeChart,
      'chart-type',
      'doughnut',
      Object.keys(s.byType).map((k) => TYPE_LABELS[k]),
      Object.values(s.byType),
      'Itens por tipo',
    );
    statusChart = drawChart(
      statusChart,
      'chart-status',
      'bar',
      Object.keys(s.byStatus).map((k) => STATUS_NAMES[k]),
      Object.values(s.byStatus),
      'Itens por status',
    );

    const list = document.getElementById('top-genres');
    list.innerHTML = s.topGenres.length
      ? s.topGenres
          .map((g) => `<li>${escapeHtml(g.genre)} <strong>${g.count}</strong></li>`)
          .join('')
      : '<li>Ainda sem gêneros cadastrados.</li>';
  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err);
  }
}

loadStats();
