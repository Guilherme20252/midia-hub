function normalize(item, type) {
  if (type === 'game') {
    return {
      externalId: String(item.id),
      type,
      title: item.name,
      posterUrl: item.background_image || '',
    };
  }
  return {
    externalId: String(item.id),
    type,
    title: item.title || item.name,
    posterUrl: item.poster_path
      ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
      : '',
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
  return data.results.map((item) => normalize(item, type));
}

module.exports = { searchMedia };