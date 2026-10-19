// Gêneros da RAWG (inglês) -> nomes em português, iguais aos da TMDB
const GAME_GENRES_PT = {
  Action: 'Ação',
  Adventure: 'Aventura',
  Arcade: 'Arcade',
  'Board Games': 'Jogos de tabuleiro',
  Card: 'Cartas',
  Casual: 'Casual',
  Educational: 'Educacional',
  Family: 'Família',
  Fighting: 'Luta',
  Indie: 'Indie',
  'Massively Multiplayer': 'Multijogador massivo',
  Platformer: 'Plataforma',
  Puzzle: 'Quebra-cabeça',
  Racing: 'Corrida',
  RPG: 'RPG',
  Shooter: 'Tiro',
  Simulation: 'Simulação',
  Sports: 'Esportes',
  Strategy: 'Estratégia',
};

function translateGenre(name) {
  return GAME_GENRES_PT[name] || name;
}

module.exports = { translateGenre };
