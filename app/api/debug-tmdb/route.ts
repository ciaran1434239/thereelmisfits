import { NextResponse } from 'next/server';

export async function GET() {
  const KEY = process.env.TMDB_API_KEY;
  const today = new Date();
  const past21 = new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);
  const future60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [npRes, upRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${KEY}&region=GB&language=en-US&page=1`, { cache: 'no-store' }),
    fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${KEY}&region=GB&language=en-US&page=1`, { cache: 'no-store' }),
  ]);

  const [npData, upData] = await Promise.all([npRes.json(), upRes.json()]);

  const nowPlaying = (npData.results ?? []).slice(0, 15).map((m: any) => ({
    title: m.title,
    release_date: m.release_date,
    popularity: Math.round(m.popularity),
    poster: !!m.poster_path,
    passes_21day_filter: m.release_date >= past21,
  }));

  const upcoming = (upData.results ?? []).slice(0, 15).map((m: any) => ({
    title: m.title,
    release_date: m.release_date,
    popularity: Math.round(m.popularity),
    poster: !!m.poster_path,
    passes_filter: m.release_date > todayStr && m.release_date <= future60,
  }));

  return NextResponse.json({
    today: todayStr,
    past21,
    future60,
    npDates: npData.dates,
    upDates: upData.dates,
    nowPlaying,
    upcoming,
  }, { status: 200 });
}
