// data/titles.ts
//
// Mock catalogue. When the real backend lands this gets replaced by API calls
// to TMDB or our own DB; until then we hardcode a small representative set.
//
// Poster images:
//   We deliberately do NOT hardcode posterUrl values for v0.2 — the previous
//   attempt had stale TMDB CDN paths that 404'd in the browser, leaving a
//   broken-image icon on every card. The gradient `poster` (3-tuple of hex
//   colors) is currently the only visual, and it's good enough to evaluate
//   layout against. To wire real posters:
//     1. Sign up at https://www.themoviedb.org/settings/api for a v3 key.
//     2. Add `tmdbId: number` to Title and populate it for each entry.
//     3. Implement a server-side helper that fetches `/movie/{id}` and
//        constructs the image URL from `poster_path` + a configured size.
//     4. Set posterUrl on the Title at fetch time, not at author time.
//   Until then, posterUrl stays unset and the Poster component falls
//   through to the gradient.

import type { Title } from '@/lib/types';

export const titles: Title[] = [
  {
    id: 't1',
    title: 'The Brutalist',
    year: 2024,
    type: 'movie',
    runtime: '215 min',
    director: 'Brady Corbet',
    genre: ['Drama', 'Period'],
    poster: ['#3A2A1F', '#7A5635', '#C9905E'],
    availability: ['streaming'],
    synopsis:
      'A Hungarian-Jewish architect emigrates to postwar America to rebuild his life and his work — under the patronage of a wealthy industrialist whose interest curdles into something else entirely.',
    featured: true,
  },
{
    id: 't9',
    title: 'The Fall Guy',
    year: 2024,
    type: 'movie',
    runtime: '126 min',
    director: 'David Leitch',
    genre: ['Action', 'Comedy'],
    poster: ['#1A1A1A', '#C8201F', '#4A0F0F'], // Red/Black gradient
    availability: ['cinemas'],
    synopsis: 'A stuntman, fresh off an almost career-ending accident, has to track down a missing movie star to save his ex-girlfriend\'s film.',
  },
  {
    id: 't10',
    title: 'Challengers',
    year: 2024,
    type: 'movie',
    runtime: '131 min',
    director: 'Luca Guadagnino',
    genre: ['Drama', 'Sport'],
    poster: ['#F2F1EE', '#2BA640', '#065FD4'], // Tennis court colors
    availability: ['cinemas'],
    synopsis: 'Tashi, a tennis player turned coach, has taken her husband, Art, and transformed him into a world-famous grand slam champion.',
  },
  {
    id: 't11',
    title: 'Civil War',
    year: 2024,
    type: 'movie',
    runtime: '109 min',
    director: 'Alex Garland',
    genre: ['Action', 'Drama'],
    poster: ['#272727', '#606060', '#909090'],
    availability: ['cinemas'],
    synopsis: 'A journey across a dystopian future America, following a team of military-embedded journalists as they race against time to reach DC.',
  },
  {
    id: 't2',
    title: 'The Substance',
    year: 2024,
    type: 'movie',
    runtime: '141 min',
    director: 'Coralie Fargeat',
    genre: ['Body Horror', 'Satire'],
    poster: ['#2A1F2A', '#8B3A5E', '#E8A33D'],
    availability: ['streaming'],
    synopsis:
      'A fading celebrity injects herself with a black-market serum that produces a younger version of her — provided the two halves stay in balance. They do not.',
  },
  {
    id: 't3',
    title: 'Severance',
    year: 2025,
    type: 'tv',
    runtime: 'S2 · 10 eps',
    director: 'Dan Erickson',
    genre: ['Sci-Fi', 'Workplace'],
    poster: ['#0F1F2A', '#1F4A6B', '#7BA7C9'],
    availability: ['streaming', 'tv'],
    synopsis:
      'The innies confront what their outies have done — and Lumon doubles down on goats, marching bands, and bureaucratic horror.',
  },
  {
    id: 't4',
    title: 'Anora',
    year: 2024,
    type: 'movie',
    runtime: '139 min',
    director: 'Sean Baker',
    genre: ['Comedy', 'Drama'],
    poster: ['#1A0F1A', '#6B1F4A', '#E84D7A'],
    availability: ['streaming'],
    synopsis:
      'A Brooklyn sex worker meets, marries, and is rapidly un-married from the son of a Russian oligarch over the course of one chaotic week.',
  },
  {
    id: 't5',
    title: 'Nosferatu',
    year: 2024,
    type: 'movie',
    runtime: '133 min',
    director: 'Robert Eggers',
    genre: ['Horror', 'Gothic'],
    poster: ['#0A0A0F', '#2A1F3A', '#6B5B7A'],
    availability: ['cinemas', 'streaming'],
    synopsis:
      'Eggers reanimates the foundational vampire myth as a fever dream of obsession, plague, and erotic dread.',
  },
  {
    id: 't6',
    title: 'The Penguin',
    year: 2024,
    type: 'tv',
    runtime: 'S1 · 8 eps',
    director: 'Lauren LeFranc',
    genre: ['Crime', 'Drama'],
    poster: ['#1A1A0F', '#3A2A1F', '#A87A2D'],
    availability: ['streaming', 'tv'],
    synopsis:
      "A Gotham crime saga that mostly forgets it's a Gotham crime saga — for the better.",
  },
  {
    id: 't7',
    title: 'Conclave',
    year: 2024,
    type: 'movie',
    runtime: '120 min',
    director: 'Edward Berger',
    genre: ['Drama', 'Political'],
    poster: ['#1A0A0A', '#5E1F1F', '#C95E5E'],
    availability: ['streaming'],
    synopsis:
      'The Pope is dead. The Cardinals are gathered. The politics are vicious, the robes are immaculate.',
  },
  {
    id: 't8',
    title: 'Companion',
    year: 2025,
    type: 'movie',
    runtime: '97 min',
    director: 'Drew Hancock',
    genre: ['Sci-Fi', 'Thriller'],
    poster: ['#0F1A1A', '#1F4A4A', '#5EC9C9'],
    availability: ['cinemas'],
    synopsis:
      'A weekend getaway curdles when one of the guests realizes she is not, in fact, who she thought she was.',
  },
];
