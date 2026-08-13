// lib/tmdb.ts

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// Base URLs for TMDB images
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original'; // For massive hero backgrounds
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';    // NEW: For sleek, fast-loading grid posters

// Basic error handling for server components
async function fetchFromTMDB(endpoint: string) {
  if (!API_KEY) {
    throw new Error('Missing TMDB_API_KEY in environment variables');
  }

  // Handle endpoints that already have query params vs those that don't
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${endpoint}${separator}api_key=${API_KEY}`;

  const response = await fetch(url, {
    next: { revalidate: 86400 } // Cache for 24 hours
  });

  if (!response.ok) {
    throw new Error(`TMDB Fetch Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

export interface TMDBMovie {
  id: number;
  title: string;
  backdrop_path: string;
  poster_path: string;
  overview: string;
  release_date: string;
}

export async function getMovieDetails(movieId: string): Promise<TMDBMovie> {
  const data = await fetchFromTMDB(`/movie/${movieId}`);
  return data;
}

export function getFullBackdropUrl(path: string | null): string {
  if (!path) return ''; 
  return `${IMAGE_BASE_URL}${path}`;
}

// NEW: Helper to get the web-optimized grid poster
export function getFullPosterUrl(path: string | null): string {
  if (!path) return ''; 
  return `${POSTER_BASE_URL}${path}`;
}

// NEW: Search TMDB by Title & Year (Perfect for our Reviews grid)
export async function searchTitle(title: string, year?: number, type: 'movie' | 'tv' = 'movie') {
  const yearParam = year ? `&${type === 'movie' ? 'primary_release_year' : 'first_air_date_year'}=${year}` : '';
  const encodedQuery = encodeURIComponent(title);
  
  try {
    const data = await fetchFromTMDB(`/search/${type}?query=${encodedQuery}${yearParam}&page=1`);
    if (data.results && data.results.length > 0) {
      return data.results[0]; // Return the top match
    }
    return null;
  } catch (error) {
    console.error('TMDB Search failed for:', title);
    return null;
  }
}