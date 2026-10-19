const { translateGenre } = require('./genres');

const genreCache = {};

// Lista de gêneros da TMDB (id -> nome), buscada uma vez e guardada na memória
async function getGenreMap(type) {
  if (genreCache[type]) return genreCache[type];

  const params = new URLSearchParams({
    api_key: process.env.TMDB_KEY,
    language: 'pt-BR',
  });
  const res = await fetch(`https://api.themoviedb.org/3/genre/${type}/list?${params}`);
  if (!res.ok) throw new Error(`TMDB (gêneros) respondeu ${res.status}`);

  const data = await res.json();
  const map = {};
  for (const genre of data.genres) map[genre.id] = genre.name;

  genreCache[type] = map;
  return map;
}

function normalize(item, type, genreMap) {
  if (type === 'game') {
    return {
      externalId: String(item.id),
      type,
      title: item.name,
      posterUrl: item.background_image || '',
      genres: (item.genres || []).map((g) => translateGenre(g.name)), // <- mudou aqui
    };
  }
  return {
    externalId: String(item.id),
    type,
    title: item.title || item.name,
    posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : '',
    genres: (item.genre_ids || []).map((id) => genreMap[id]).filter(Boolean),
  };
}

async function searchMedia(query, type) {
  let url;

  if (type === 'game') {
    const params = new URLSearchParams({
      key: process.env.RAWG_KEY,
      search: query,
      page_size: '18',
    });
    url = `https://api.rawg.io/api/games?${params}`;
  } else {
    const params = new URLSearchParams({
      api_key: process.env.TMDB_KEY,
      query,
      language: 'pt-BR',
    });
    url = `https://api.themoviedb.org/3/search/${type}?${params}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API externa respondeu ${res.status}`);
  const data = await res.json();

  // se a lista de gêneros falhar, a busca continua funcionando (só sem gêneros)
  let genreMap = {};
  if (type !== 'game') {
    try {
      genreMap = await getGenreMap(type);
    } catch (err) {
      console.error(err.message);
    }
  }

  return data.results.map((item) => normalize(item, type, genreMap));
}

module.exports = { searchMedia };
