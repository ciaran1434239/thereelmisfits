'use client';

import { useEffect, useState } from 'react';
import { ListsEditor } from '@/components/admin/ListsEditor';

interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  youtube_channel_id: string;
  content_types: string[] | null;
}

interface PendingReview {
  id: string;
  title: string;
  youtube_video_id: string;
  posted_at: string;
  movies: { id: number; title: string } | null;
  shows: { id: number; title: string } | null;
  creators: { id: string; name: string; avatar_url: string | null } | null;
}

// ── Pending Reviews Tab ───────────────────────────────────────────────────────

function PendingReviewsTab() {
  const [allReviews, setAllReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [creatorFilter, setCreatorFilter] = useState('');

  // All reviews filtered by selected channel
  const reviews = creatorFilter
    ? allReviews.filter(r => r.creators?.name === creatorFilter)
    : allReviews;

  // Unique creator names for the dropdown
  const creatorNames = Array.from(
    new Set(allReviews.map(r => r.creators?.name).filter(Boolean))
  ).sort() as string[];

  async function load() {
    setLoading(true);
    setLoadError(null);
    const res = await fetch('/api/admin/pending-reviews?limit=100');
    const data = await res.json();
    if (!data.success) {
      setLoadError(data.error ?? 'Unknown error');
    } else {
      setAllReviews(data.reviews ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(id: string, recommend: boolean | null) {
    setSaving(id);
    await fetch('/api/admin/score-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, recommend }),
    });
    setAllReviews(prev => prev.filter(r => r.id !== id));
    setVotes(prev => { const next = { ...prev }; delete next[id]; return next; });
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
    setSaving(null);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === reviews.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(reviews.map(r => r.id)));
    }
  }

  async function deleteSelected() {
    if (!selected.size || !confirm(`Delete ${selected.size} review${selected.size > 1 ? 's' : ''} permanently?`)) return;
    setBulkDeleting(true);
    const ids = Array.from(selected);
    await fetch('/api/admin/reviews', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    setAllReviews(prev => prev.filter(r => !ids.includes(r.id)));
    setSelected(new Set());
    setBulkDeleting(false);
  }

  if (loading) {
    return <p className="text-sm text-white/40 font-bold py-8 text-center">Loading pending reviews...</p>;
  }

  if (loadError) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-sm font-black uppercase tracking-widest text-red-500 mb-2">Failed to load</p>
        <p className="text-xs text-white/40 font-mono">{loadError}</p>
        <p className="text-xs text-white/40 mt-3">Have you run the Supabase migrations?<br/>
          <code className="bg-[#222222] px-1 rounded">make-recommend-nullable.sql</code> and <code className="bg-[#222222] px-1 rounded">add-manual-override.sql</code>
        </p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">✅</p>
        <p className="text-sm font-black uppercase tracking-widest text-white/40">All caught up — nothing pending</p>
      </div>
    );
  }

  return (
    <div>
      {/* Channel filter + toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={creatorFilter}
          onChange={e => { setCreatorFilter(e.target.value); setSelected(new Set()); }}
          className="border border-[#333333] rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[#E21D1D] bg-surface-alt text-white"
        >
          <option value="">All channels</option>
          {creatorNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <p className="text-sm text-white/50 font-bold flex-1">
          <span className="text-white font-black">{reviews.length}</span>
          {creatorFilter ? ` from ${creatorFilter}` : ` reviews`} need a verdict
          {creatorFilter && allReviews.length !== reviews.length && (
            <span className="text-white/40"> ({allReviews.length} total)</span>
          )}
        </p>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={bulkDeleting}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {bulkDeleting ? 'Deleting...' : `Delete Selected (${selected.size})`}
            </button>
          )}
          <button
            onClick={toggleAll}
            className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-ink/70 transition-colors"
          >
            {selected.size === reviews.length && reviews.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {reviews.map(review => {
          const contentTitle = (review.movies as any)?.title ?? (review.shows as any)?.title ?? '—';
          const vote = votes[review.id];
          const isSaving = saving === review.id;
          const isSelected = selected.has(review.id);

          return (
            <div
              key={review.id}
              className={`bg-surface border rounded-xl shadow-sm overflow-hidden transition-colors ${isSelected ? 'border-[#E21D1D]/40 bg-[#E21D1D]/8' : 'border-[#2A2A2A]'}`}
            >
              <div className="flex gap-4 p-4">

                {/* Checkbox */}
                <div className="flex items-start pt-1 shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(review.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#E21D1D] focus:ring-[#E21D1D] cursor-pointer"
                  />
                </div>

                {/* YouTube thumbnail */}
                <a
                  href={`https://www.youtube.com/watch?v=${review.youtube_video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 relative block w-36 aspect-video rounded-lg overflow-hidden bg-[#222222] hover:opacity-80 transition-opacity"
                >
                  <img
                    src={`https://i.ytimg.com/vi/${review.youtube_video_id}/mqdefault.jpg`}
                    alt={review.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white fill-current ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </a>

                {/* Review info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#E21D1D] mb-0.5">
                    {contentTitle}
                  </p>
                  <p className="text-sm font-black text-white leading-tight mb-2 line-clamp-2">
                    {review.title}
                  </p>
                  <div className="flex items-center gap-2">
                    {review.creators?.avatar_url && (
                      <img
                        src={review.creators.avatar_url}
                        alt={review.creators.name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    )}
                    <p className="text-[11px] text-white/40 font-bold">{review.creators?.name}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-center gap-2 shrink-0 justify-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVotes(v => {
                        const next = { ...v };
                        if (next[review.id] === true) { delete next[review.id]; } else { next[review.id] = true; }
                        return next;
                      })}
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-all ${
                        vote === true
                          ? 'bg-emerald-500 border-emerald-500 scale-110'
                          : 'border-[#333333] text-white/40 hover:border-emerald-400 hover:text-emerald-500'
                      }`}
                      title="Recommends"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => setVotes(v => {
                        const next = { ...v };
                        if (next[review.id] === false) { delete next[review.id]; } else { next[review.id] = false; }
                        return next;
                      })}
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-all ${
                        vote === false
                          ? 'bg-rose-500 border-rose-500 scale-110'
                          : 'border-[#333333] text-white/40 hover:border-rose-400 hover:text-rose-500'
                      }`}
                      title="Skip it"
                    >
                      👎
                    </button>
                  </div>
                  <button
                    onClick={() => save(review.id, vote !== undefined ? vote : null)}
                    disabled={isSaving}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
                      vote !== undefined
                        ? 'bg-gray-900 text-white hover:bg-surface/10'
                        : 'bg-[#222222] text-white/50 hover:bg-[#2A2A2A]'
                    }`}
                  >
                    {isSaving ? '...' : vote !== undefined ? 'Save' : 'Dismiss'}
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Reviews Tab ──────────────────────────────────────────────────────────────

interface AdminReview {
  id: string;
  title: string;
  snippet: string | null;
  score: number | null;
  recommend: boolean | null;
  is_manual_override: boolean;
  posted_at: string;
  youtube_video_id: string;
  movies: { id: number; title: string } | null;
  shows: { id: number; title: string } | null;
  creators: { id: string; name: string; avatar_url: string | null } | null;
}

interface ContentResult {
  id: number;
  title: string;
  type: 'movie' | 'show';
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [clearingSnippet, setClearingSnippet] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [creatorFilter, setCreatorFilter] = useState<string>('');
  const PAGE = 100;

  const [reclassifying, setReclassifying] = useState<string | null>(null);
  const [reSearch, setReSearch] = useState('');
  const [reResults, setReResults] = useState<ContentResult[]>([]);
  const [reSearching, setReSearching] = useState(false);
  const [reSaving, setReSaving] = useState(false);
  const [verdictSaving, setVerdictSaving] = useState<string | null>(null);

  async function changeVerdict(id: string, recommend: boolean | null) {
    setVerdictSaving(id);
    await fetch('/api/admin/score-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, recommend }),
    });
    setReviews(prev => prev.map(r => r.id === id
      ? { ...r, recommend, is_manual_override: true }
      : r
    ));
    setVerdictSaving(null);
  }

  async function searchContent(term: string) {
    if (!term.trim()) { setReResults([]); return; }
    setReSearching(true);
    const [movRes, showRes] = await Promise.all([
      fetch(`/api/admin/search-content?q=${encodeURIComponent(term)}&type=movie`).then(r => r.json()),
      fetch(`/api/admin/search-content?q=${encodeURIComponent(term)}&type=show`).then(r => r.json()),
    ]);
    const results: ContentResult[] = [
      ...(movRes.results ?? []).map((m: any) => ({ id: m.id, title: m.title, type: 'movie' as const })),
      ...(showRes.results ?? []).map((s: any) => ({ id: s.id, title: s.name ?? s.title, type: 'show' as const })),
    ];
    setReResults(results.slice(0, 8));
    setReSearching(false);
  }

  async function reclassify(reviewId: string, target: ContentResult) {
    setReSaving(true);
    const body = target.type === 'movie'
      ? { id: reviewId, movie_id: target.id }
      : { id: reviewId, show_id: target.id };
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setReviews(prev => prev.map(r => r.id === reviewId
      ? { ...r,
          movies: target.type === 'movie' ? { id: target.id, title: target.title } : null,
          shows: target.type === 'show' ? { id: target.id, title: target.title } : null }
      : r
    ));
    setReclassifying(null);
    setReSearch('');
    setReResults([]);
    setReSaving(false);
  }

  async function load(q: string, off: number, creator = creatorFilter) {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE), offset: String(off) });
    if (q) params.set('search', q);
    const res = await fetch(`/api/admin/reviews?${params}`);
    const data = await res.json();
    // Apply creator filter client-side (since API doesn't support it yet)
    const all: AdminReview[] = data.reviews ?? [];
    const filtered = creator ? all.filter(r => (r.creators as any)?.name === creator) : all;
    setReviews(filtered);
    setTotal(data.total ?? 0);
    setSelected(new Set());
    setLoading(false);
  }

  useEffect(() => { load('', 0, ''); }, []);

  async function clearSnippet(id: string) {
    setClearingSnippet(id);
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'clear_snippet' }),
    });
    setReviews(prev => prev.map(r => r.id === id ? { ...r, snippet: null } : r));
    setClearingSnippet(null);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setOffset(0);
    setQuery(search);
    load(search, 0);
  }

  async function deleteReview(id: string) {
    if (!confirm('Delete this review permanently?')) return;
    setDeleting(id);
    await fetch('/api/admin/reviews', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setReviews(prev => prev.filter(r => r.id !== id));
    setTotal(prev => prev - 1);
    setDeleting(null);
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === reviews.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(reviews.map(r => r.id)));
    }
  }

  async function deleteSelected() {
    if (!selected.size || !confirm(`Delete ${selected.size} review${selected.size > 1 ? 's' : ''} permanently?`)) return;
    setBulkDeleting(true);
    const ids = Array.from(selected);
    await fetch('/api/admin/reviews', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    setReviews(prev => prev.filter(r => !ids.includes(r.id)));
    setTotal(prev => prev - ids.length);
    setSelected(new Set());
    setBulkDeleting(false);
  }

  function handlePage(dir: 'prev' | 'next') {
    const newOffset = dir === 'next' ? offset + PAGE : offset - PAGE;
    setOffset(newOffset);
    load(query, newOffset);
  }

  // Derive unique creator names from loaded reviews for the filter dropdown
  const allCreatorNames = Array.from(
    new Set(reviews.map(r => (r.creators as any)?.name).filter(Boolean))
  ).sort() as string[];
  // Also always include the currently selected creator even if filtered out
  const creatorOptions = creatorFilter && !allCreatorNames.includes(creatorFilter)
    ? [creatorFilter, ...allCreatorNames]
    : allCreatorNames;

  return (
    <div>
      {/* Search + filters */}
      <div className="flex flex-col gap-2 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by review title..."
            className="flex-1 border border-[#333333] rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:border-[#E21D1D] bg-surface-alt text-white"
          />
          <button
            type="submit"
            className="bg-gray-900 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Search
          </button>
          {query && (
            <button
              type="button"
              onClick={() => { setSearch(''); setQuery(''); setOffset(0); load('', 0, creatorFilter); }}
              className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg border border-[#333333] text-white/50 hover:bg-surface-alt"
            >
              Clear
            </button>
          )}
        </form>
        <div className="flex items-center gap-3">
          <select
            value={creatorFilter}
            onChange={e => {
              const val = e.target.value;
              setCreatorFilter(val);
              setOffset(0);
              load(query, 0, val);
            }}
            className="border border-[#333333] rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[#E21D1D] bg-surface-alt text-white"
          >
            <option value="">All channels</option>
            {creatorOptions.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <p className="text-sm font-bold text-white/40">
            {loading ? '...' : `${reviews.length}${creatorFilter ? '' : ` of ${total}`} reviews`}
          </p>
          {creatorFilter && (
            <button
              onClick={() => { setCreatorFilter(''); load(query, 0, ''); }}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#333333] text-white/50 hover:bg-surface-alt"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {!loading && reviews.length > 0 && (
        <div className="flex items-center gap-4 mb-3 px-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.size === reviews.length && reviews.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-gray-300 text-[#E21D1D] focus:ring-[#E21D1D]"
            />
            <span className="text-[11px] font-bold text-white/50">
              {selected.size === 0 ? 'Select all' : `${selected.size} selected`}
            </span>
          </label>
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={bulkDeleting}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {bulkDeleting ? 'Deleting...' : `Delete Selected (${selected.size})`}
            </button>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-white/40 font-bold py-8 text-center">Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-white/40 font-bold py-8 text-center">No reviews found</p>
      ) : (
        <div className="flex flex-col divide-y divide-[#2A2A2A] bg-surface border border-[#2A2A2A] rounded-xl shadow-sm overflow-hidden">
          {reviews.map(review => {
            const contentTitle = (review.movies as any)?.title ?? (review.shows as any)?.title ?? '—';
            const isReclassifying = reclassifying === review.id;
            const isSelected = selected.has(review.id);
            return (
              <div key={review.id} className={`transition-colors ${isSelected ? 'bg-[#E21D1D]/10' : 'hover:bg-surface-alt'}`}>
                <div className="flex items-start gap-3 px-4 py-3">
                  {/* Checkbox */}
                  <div className="flex items-center pt-1.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(review.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#E21D1D] focus:ring-[#E21D1D] cursor-pointer"
                    />
                  </div>

                  {/* Thumbnail */}
                  <a
                    href={`https://www.youtube.com/watch?v=${review.youtube_video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 relative block w-24 aspect-video rounded overflow-hidden bg-[#222222] hover:opacity-80 transition-opacity mt-0.5"
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${review.youtube_video_id}/mqdefault.jpg`}
                      alt={review.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </a>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#E21D1D]">
                        {contentTitle}
                      </span>
                      {review.recommend === true && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">👍</span>
                      )}
                      {review.recommend === false && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">👎</span>
                      )}
                      {review.recommend === null && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#222222] text-white/40">Unscored</span>
                      )}
                      {review.is_manual_override && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-100 text-blue-500">Manual</span>
                      )}
                    </div>
                    <p className="text-sm font-black text-white leading-tight truncate">{review.title}</p>
                    <p className="text-[11px] text-white/40 font-bold mt-0.5">{review.creators?.name}</p>
                    {review.snippet && (
                      <div className="flex items-start gap-2 mt-1">
                        <p className="text-[11px] text-white/50 italic line-clamp-1 flex-1">"{review.snippet}"</p>
                        <button
                          onClick={() => clearSnippet(review.id)}
                          disabled={clearingSnippet === review.id}
                          className="shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-orange-200 text-orange-400 hover:bg-orange-50 hover:text-orange-600 transition-colors disabled:opacity-40"
                          title="Clear this snippet"
                        >
                          {clearingSnippet === review.id ? '...' : '✕ snippet'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-1 shrink-0 mt-0.5">
                    {/* Verdict buttons — flips recommend and marks is_manual_override */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => changeVerdict(review.id, true)}
                        disabled={verdictSaving === review.id || review.recommend === true}
                        title="Mark as Recommends"
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors disabled:cursor-default ${
                          review.recommend === true
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-[#333333] text-white/40 hover:border-emerald-400 hover:text-emerald-600'
                        }`}
                      >
                        👍
                      </button>
                      <button
                        onClick={() => changeVerdict(review.id, false)}
                        disabled={verdictSaving === review.id || review.recommend === false}
                        title="Mark as Skip it"
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors disabled:cursor-default ${
                          review.recommend === false
                            ? 'bg-rose-500 border-rose-500 text-white'
                            : 'border-[#333333] text-white/40 hover:border-rose-400 hover:text-rose-600'
                        }`}
                      >
                        👎
                      </button>
                      <button
                        onClick={() => changeVerdict(review.id, null)}
                        disabled={verdictSaving === review.id || review.recommend === null}
                        title="Mark as Unscored"
                        className={`text-[10px] font-black px-2 py-0.5 rounded border transition-colors disabled:cursor-default ${
                          review.recommend === null
                            ? 'bg-gray-200 border-[#333333] text-white/60'
                            : 'border-[#333333] text-white/30 hover:border-gray-400 hover:text-white/50'
                        }`}
                      >
                        —
                      </button>
                    </div>
                    <button
                      onClick={() => deleteReview(review.id)}
                      disabled={deleting === review.id}
                      className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-red-500 transition-colors px-2 py-1 rounded border border-[#2A2A2A] hover:border-red-200 disabled:opacity-50"
                    >
                      {deleting === review.id ? '...' : 'Delete'}
                    </button>
                    <button
                      onClick={() => {
                        setReclassifying(isReclassifying ? null : review.id);
                        setReSearch('');
                        setReResults([]);
                      }}
                      className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border transition-colors ${
                        isReclassifying
                          ? 'border-gray-900 text-white bg-[#222222]'
                          : 'border-[#2A2A2A] text-white/30 hover:text-blue-500 hover:border-blue-200'
                      }`}
                    >
                      Wrong match?
                    </button>
                  </div>
                </div>

                {/* Reclassify panel */}
                {isReclassifying && (
                  <div className="mx-4 mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">
                      Reassign to a different movie or show
                    </p>
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={reSearch}
                        onChange={e => {
                          setReSearch(e.target.value);
                          searchContent(e.target.value);
                        }}
                        placeholder="Search movies & shows..."
                        className="flex-1 border border-blue-200 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-blue-400 bg-surface text-white"
                      />
                      {reSearching && (
                        <span className="text-[11px] text-blue-400 font-bold self-center">Searching...</span>
                      )}
                    </div>
                    {reResults.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        {reResults.map(result => (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => reclassify(review.id, result)}
                            disabled={reSaving}
                            className="flex items-center gap-2 px-3 py-2 rounded bg-surface border border-blue-100 hover:border-blue-300 hover:bg-blue-50 text-left transition-colors disabled:opacity-50"
                          >
                            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                              result.type === 'movie' ? 'bg-[#222222] text-white/50' : 'bg-purple-100 text-purple-600'
                            }`}>
                              {result.type}
                            </span>
                            <span className="text-sm font-bold text-white">{result.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {reSearch && !reSearching && reResults.length === 0 && (
                      <p className="mt-2 text-[11px] text-white/40 font-bold">No results found</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => handlePage('prev')}
            disabled={offset === 0}
            className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg border border-[#333333] text-white/50 hover:bg-surface-alt disabled:opacity-30"
          >
            ← Prev
          </button>
          <p className="text-xs font-bold text-white/40">
            {offset + 1}–{Math.min(offset + PAGE, total)} of {total}
          </p>
          <button
            onClick={() => handlePage('next')}
            disabled={offset + PAGE >= total}
            className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg border border-[#333333] text-white/50 hover:bg-surface-alt disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Manual Add Tab ────────────────────────────────────────────────────────────

interface ClassifyResult {
  videoId: string;
  title: string;
  publishedAt: string;
  classification: {
    isReview: boolean;
    contentTitle: string | null;
    contentType: 'movie' | 'tv' | null;
  };
  tmdbMatch: {
    id: number;
    title: string;
    type: 'movie' | 'tv';
    backdrop_path: string | null;
    release_date: string | null;
  } | null;
  snippet: string | null;
}

function ManualAddTab({ creators }: { creators: Creator[] }) {
  const [input, setInput] = useState('');
  const [classifying, setClassifying] = useState(false);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reviewCreators = creators.filter(c => c.content_types?.includes('review'));
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('');
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [overrideTmdb, setOverrideTmdb] = useState(false);
  const [tmdbSearch, setTmdbSearch] = useState('');
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [tmdbSearching, setTmdbSearching] = useState(false);
  const [chosenTmdb, setChosenTmdb] = useState<ClassifyResult['tmdbMatch'] | null>(null);

  const [adding, setAdding] = useState(false);
  const [addedMsg, setAddedMsg] = useState<string | null>(null);

  // Set default creator once loaded
  useEffect(() => {
    if (!selectedCreatorId && reviewCreators.length > 0 && reviewCreators[0]) {
      setSelectedCreatorId(reviewCreators[0].id);
    }
  }, [creators]);

  async function classify() {
    setError(null);
    setResult(null);
    setChosenTmdb(null);
    setOverrideTmdb(false);
    setRecommend(null);
    if (!input.trim()) return;
    setClassifying(true);
    const res = await fetch(`/api/admin/add-review?videoId=${encodeURIComponent(input.trim())}`);
    const data = await res.json();
    setClassifying(false);
    if (!data.success) {
      setError(data.error ?? 'Unknown error');
    } else {
      setResult(data);
      setChosenTmdb(data.tmdbMatch);
    }
  }

  async function searchTmdb(term: string) {
    if (!term.trim()) { setTmdbResults([]); return; }
    setTmdbSearching(true);
    const [movRes, showRes] = await Promise.all([
      fetch(`/api/admin/search-content?q=${encodeURIComponent(term)}&type=movie`).then(r => r.json()),
      fetch(`/api/admin/search-content?q=${encodeURIComponent(term)}&type=show`).then(r => r.json()),
    ]);
    const results = [
      ...(movRes.results ?? []).map((m: any) => ({ id: m.id, title: m.title, type: 'movie' as const })),
      ...(showRes.results ?? []).map((s: any) => ({ id: s.id, title: s.name ?? s.title, type: 'tv' as const })),
    ];
    setTmdbResults(results.slice(0, 8));
    setTmdbSearching(false);
  }

  async function addReview() {
    if (!result || !chosenTmdb || !selectedCreatorId) return;
    setAdding(true);
    const res = await fetch('/api/admin/add-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: result.videoId,
        creatorId: selectedCreatorId,
        tmdbId: chosenTmdb.id,
        tmdbType: chosenTmdb.type,
        recommend,
        publishedAt: result.publishedAt,
        title: result.title,
        snippet: result.snippet,
      }),
    });
    const data = await res.json();
    setAdding(false);
    if (data.success) {
      setAddedMsg(`✓ Added "${result.title}" to the database`);
      setInput('');
      setResult(null);
      setChosenTmdb(null);
      setRecommend(null);
    } else {
      setError(data.error ?? 'Failed to add');
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-white/40 font-bold mb-6">
        Paste a YouTube URL or video ID to add a video that the sync missed or rejected.
      </p>

      {addedMsg && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-700 flex items-center justify-between">
          {addedMsg}
          <button onClick={() => setAddedMsg(null)} className="text-emerald-400 hover:text-emerald-600 text-xs ml-4 shrink-0">Dismiss</button>
        </div>
      )}

      {/* URL input */}
      <div className="flex gap-2 mb-6">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && classify()}
          placeholder="https://youtube.com/watch?v=... or bare video ID"
          className="flex-1 border border-[#333333] rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#E21D1D] bg-surface-alt text-white"
        />
        <button
          onClick={classify}
          disabled={classifying || !input.trim()}
          className="bg-gray-900 text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-surface/10 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {classifying ? 'Classifying...' : 'Classify'}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      {/* Classification result */}
      {result && (
        <div className="bg-surface border border-[#2A2A2A] rounded-2xl shadow-sm overflow-hidden">

          {/* Video info */}
          <div className="flex gap-4 p-5 border-b border-[#2A2A2A]">
            <img
              src={`https://i.ytimg.com/vi/${result.videoId}/mqdefault.jpg`}
              alt={result.title}
              className="w-32 aspect-video rounded-lg object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Video</p>
              <p className="text-sm font-black text-white leading-tight mb-2">{result.title}</p>
              <p className="text-[11px] text-white/40 font-bold">
                {new Date(result.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* AI classification */}
          <div className="p-5 border-b border-[#2A2A2A]">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">AI Classification</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                result.classification.isReview ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
              }`}>
                {result.classification.isReview ? '✓ Detected as review' : '✗ Not detected as review'}
              </span>
              {result.classification.contentTitle && (
                <span className="text-[11px] font-bold text-white/60">
                  Reviewing: <span className="text-white font-black">"{result.classification.contentTitle}"</span>
                </span>
              )}
              {result.classification.contentType && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#222222] text-white/50">
                  {result.classification.contentType === 'movie' ? '🎬 Movie' : '📺 TV'}
                </span>
              )}
            </div>
          </div>

          {/* TMDB match */}
          <div className="p-5 border-b border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">TMDB Match</p>
              <button
                onClick={() => { setOverrideTmdb(!overrideTmdb); setTmdbSearch(''); setTmdbResults([]); }}
                className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-700"
              >
                {overrideTmdb ? 'Cancel' : 'Change Match'}
              </button>
            </div>

            {chosenTmdb ? (
              <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                  chosenTmdb.type === 'movie' ? 'bg-gray-200 text-white/60' : 'bg-purple-100 text-purple-600'
                }`}>
                  {chosenTmdb.type === 'movie' ? 'Movie' : 'TV Show'}
                </span>
                <p className="text-sm font-black text-white">{chosenTmdb.title}</p>
                {chosenTmdb.release_date && (
                  <p className="text-[11px] text-white/40 font-bold ml-auto">{chosenTmdb.release_date.substring(0, 4)}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/40 font-bold italic">No TMDB match found — search below to assign one</p>
            )}

            {(overrideTmdb || !chosenTmdb) && (
              <div className="mt-3">
                <input
                  value={tmdbSearch}
                  onChange={e => { setTmdbSearch(e.target.value); searchTmdb(e.target.value); }}
                  placeholder="Search movies & shows..."
                  className="w-full border border-[#333333] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-400 bg-surface-alt text-white"
                />
                {tmdbSearching && <p className="text-[11px] text-blue-400 font-bold mt-1">Searching...</p>}
                {tmdbResults.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {tmdbResults.map((r: any) => (
                      <button
                        key={`${r.type}-${r.id}`}
                        onClick={() => { setChosenTmdb(r); setOverrideTmdb(false); setTmdbSearch(''); setTmdbResults([]); }}
                        className="flex items-center gap-2 px-3 py-2 rounded bg-surface border border-[#2A2A2A] hover:border-blue-200 hover:bg-blue-50 text-left transition-colors"
                      >
                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          r.type === 'movie' ? 'bg-[#222222] text-white/50' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {r.type === 'movie' ? 'Movie' : 'TV'}
                        </span>
                        <span className="text-sm font-bold text-white">{r.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Creator + Verdict + Add */}
          <div className="p-5 flex flex-col gap-4">
            {/* Creator */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Assign to Creator</p>
              <select
                value={selectedCreatorId}
                onChange={e => setSelectedCreatorId(e.target.value)}
                className="border border-[#333333] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#E21D1D] bg-surface-alt text-white"
              >
                {reviewCreators.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Verdict */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Verdict (optional — you can backfill later)</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setRecommend(recommend === true ? null : true)}
                  className={`flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-lg border-2 transition-all ${
                    recommend === true ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[#333333] text-white/40 hover:border-emerald-400'
                  }`}
                >
                  👍 Recommends
                </button>
                <button
                  onClick={() => setRecommend(recommend === false ? null : false)}
                  className={`flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-lg border-2 transition-all ${
                    recommend === false ? 'bg-rose-500 border-rose-500 text-white' : 'border-[#333333] text-white/40 hover:border-rose-400'
                  }`}
                >
                  👎 Skip it
                </button>
                {recommend !== null && (
                  <button onClick={() => setRecommend(null)} className="text-xs font-bold text-white/40 hover:text-white/80 px-2">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Add button */}
            <button
              onClick={addReview}
              disabled={adding || !chosenTmdb || !selectedCreatorId}
              className="w-full bg-gray-900 text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl hover:bg-surface/10 disabled:opacity-50 transition-colors"
            >
              {adding ? 'Adding...' : 'Add to Database'}
            </button>

            {!chosenTmdb && (
              <p className="text-[11px] text-amber-600 font-bold text-center -mt-2">
                ⚠️ Select a TMDB match above before adding
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sync & Backfill Tab ───────────────────────────────────────────────────────

function SyncTab() {
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function run(label: string, url: string, method = 'GET') {
    setRunning(label);
    setResult(null);
    try {
      const res = await fetch(url, { method });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    }
    setRunning(null);
  }

  const busy = running !== null;

  return (
    <div className="max-w-2xl flex flex-col gap-6">

      {/* Step 1 — Sync */}
      <div className="bg-surface border border-[#2A2A2A] rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-widest text-white mb-1">1 — Sync New Reviews</h2>
        <p className="text-[11px] text-white/40 font-bold mb-5">
          Pulls new videos from every channel and classifies them. Run roughly every 5 days.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => run('sync5d', '/api/deep-sync?since=120')}
            disabled={busy}
            className="bg-[#E21D1D] text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {running === 'sync5d' ? 'Syncing…' : '⚡ Sync (last 5 days)'}
          </button>
          <button
            onClick={() => run('sync24h', '/api/deep-sync?since=24')}
            disabled={busy}
            className="bg-[#333] text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#444] disabled:opacity-50"
          >
            {running === 'sync24h' ? 'Syncing…' : 'Sync (last 24h)'}
          </button>
          <button
            onClick={() => { if (confirm('Full scan checks every video ever posted — takes several minutes. Continue?')) run('syncFull', '/api/deep-sync'); }}
            disabled={busy}
            className="bg-[#333] text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#444] disabled:opacity-50"
          >
            {running === 'syncFull' ? 'Scanning…' : '🔍 Full Scan (all time)'}
          </button>
        </div>
      </div>

      {/* Step 2 — Backfill */}
      <div className="bg-surface border border-[#2A2A2A] rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-widest text-white mb-1">2 — Backfill Snippets & Verdicts</h2>
        <p className="text-[11px] text-white/40 font-bold mb-5">
          Reads transcripts for reviews missing a quote or verdict. Run this after syncing.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => run('backfill', '/api/backfill')}
            disabled={busy}
            className="bg-[#E21D1D] text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {running === 'backfill' ? 'Running…' : '⚡ Backfill Snippets'}
          </button>
          <button
            onClick={() => run('backfillForce', '/api/backfill?force=true')}
            disabled={busy}
            className="bg-[#333] text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-lg hover:bg-[#444] disabled:opacity-50"
          >
            {running === 'backfillForce' ? 'Running…' : 'Re-process All'}
          </button>
        </div>
        <p className="text-[10px] text-white/25 font-bold mt-3">
          "Re-process All" re-runs the AI on every review — use this after updating scoring rules.
        </p>
      </div>

      {/* Misc */}
      <div className="bg-surface border border-[#2A2A2A] rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-widest text-white mb-4">Other</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => run('refreshAvatars', '/api/admin/refresh-avatars')}
            disabled={busy}
            className="bg-[#333] text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-[#444] disabled:opacity-50"
          >
            {running === 'refreshAvatars' ? 'Running…' : 'Refresh Avatars'}
          </button>
          <button
            onClick={() => run('cleanup', '/api/admin/cleanup', 'POST')}
            disabled={busy}
            className="bg-[#333] text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-[#444] disabled:opacity-50"
          >
            {running === 'cleanup' ? 'Cleaning…' : 'Clean Bad Reviews'}
          </button>
        </div>
      </div>

      {result && (
        <pre className="text-xs font-mono bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 overflow-x-auto whitespace-pre-wrap text-white/60">
          {result}
        </pre>
      )}
    </div>
  );
}

// ── Box Office Tab ────────────────────────────────────────────────────────────

interface BOEntry {
  id?: number;
  week_of: string;
  region: 'domestic' | 'global';
  rank: number;
  title: string;
  weekend_gross: number;
  total_gross: number;
  weeks_in_release: number;
  change_pct: number | null;
  studio: string | null;
  is_new: boolean;
  movie_id: number | null;
}

const EXAMPLE_JSON = `[
  { "rank": 1, "tmdb_id": 575265, "title": "Mission: Impossible – The Final Reckoning", "studio": "Paramount", "weekend_gross": 52300000, "total_gross": 52300000, "weeks_released": 1 },
  { "rank": 2, "tmdb_id": 552524, "title": "Lilo & Stitch", "studio": "Disney", "weekend_gross": 28100000, "total_gross": 194700000, "weeks_released": 3 },
  { "rank": 3, "tmdb_id": 574475, "title": "Final Destination Bloodlines", "studio": "New Line", "weekend_gross": 14200000, "total_gross": 71000000, "weeks_released": 2 }
]`;

function BoxOfficeTab() {
  const [weeks, setWeeks] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [domestic, setDomestic] = useState<BOEntry[]>([]);
  const [global, setGlobal] = useState<BOEntry[]>([]);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Bulk import state
  const [importWeek, setImportWeek]     = useState('');
  const [importRegion, setImportRegion] = useState<'domestic' | 'global'>('domestic');
  const [importJson, setImportJson]     = useState('');
  const [importing, setImporting]       = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  function flash(type: 'ok' | 'err', text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  }

  async function loadWeeks() {
    const res = await fetch('/api/admin/box-office');
    const data = await res.json();
    if (data.success) setWeeks(data.weeks ?? []);
  }

  async function loadEntriesForWeek(week: string) {
    setLoadingWeek(true);
    const res = await fetch(`/api/admin/box-office?week=${encodeURIComponent(week)}`);
    const data = await res.json();
    if (data.success) {
      setDomestic(data.domestic ?? []);
      setGlobal(data.global ?? []);
    }
    setLoadingWeek(false);
  }

  useEffect(() => { loadWeeks(); }, []);

  useEffect(() => {
    if (selectedWeek) loadEntriesForWeek(selectedWeek);
  }, [selectedWeek]);

  async function deleteWeek(week: string) {
    if (!confirm(`Delete all box office data for the week of ${week}? This cannot be undone.`)) return;
    const res = await fetch('/api/admin/box-office', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_week', week_of: week }),
    });
    if ((await res.json()).success) {
      flash('ok', `Deleted week ${week}`);
      setSelectedWeek('');
      setDomestic([]); setGlobal([]);
      loadWeeks();
    }
  }

  async function submitBulkImport() {
    if (!importWeek || !importJson.trim()) return;
    let entries: any[];
    try {
      entries = JSON.parse(importJson.trim());
      if (!Array.isArray(entries)) throw new Error('Must be a JSON array');
    } catch (e: any) {
      flash('err', `Invalid JSON: ${e.message}`);
      return;
    }

    setImporting(true);
    setImportResult(null);
    const res = await fetch('/api/admin/box-office', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk_import', week_of: importWeek, region: importRegion, entries }),
    });
    const data = await res.json();
    setImporting(false);

    if (data.success) {
      const unmatched = data.inserted - data.matched;
      setImportResult(
        `✓ Imported ${data.inserted} entries — ${data.matched} matched to a movie` +
        (unmatched > 0 ? ` · ${unmatched} unmatched (movie_id will be null — check titles)` : '')
      );
      flash('ok', `Imported ${data.inserted} rows for ${importRegion} chart`);
      if (!weeks.includes(importWeek)) setWeeks(prev => [importWeek, ...prev]);
      setSelectedWeek(importWeek);
      setImportJson('');
    } else {
      flash('err', data.error ?? 'Import failed');
    }
  }

  const fmtWeek = (w: string) => new Date(w).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="max-w-2xl">
      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-bold ${msg.type === 'ok' ? 'bg-emerald-900/40 border border-emerald-700 text-emerald-400' : 'bg-red-900/40 border border-red-700 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* ── Bulk Import ── */}
      <div className="bg-surface border border-[#2A2A2A] rounded-2xl p-6 mb-8 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-widest mb-1">Bulk Import JSON</h2>
        <p className="text-[11px] text-white/40 font-bold mb-5">
          Paste the AI-parsed Box Office Mojo array. Include{' '}
          <code className="bg-[#222] px-1 rounded">tmdb_id</code>{' '}
          (from themoviedb.org) for reliable poster matching — without it, posters fall back to fuzzy title matching which fails on colons and subtitles.
          Required fields: <code className="bg-[#222] px-1 rounded">rank</code>,{' '}
          <code className="bg-[#222] px-1 rounded">title</code>,{' '}
          <code className="bg-[#222] px-1 rounded">studio</code>,{' '}
          <code className="bg-[#222] px-1 rounded">weekend_gross</code>,{' '}
          <code className="bg-[#222] px-1 rounded">total_gross</code>,{' '}
          <code className="bg-[#222] px-1 rounded">weeks_released</code>.
          Gross values: raw numbers (<code className="bg-[#222] px-1 rounded">52300000</code>) or strings (<code className="bg-[#222] px-1 rounded">"$52,300,000"</code>) both work.
          Existing rows for the same week + region are replaced.
        </p>

        <div className="flex gap-3 mb-4 flex-wrap">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Week of</label>
            <input
              type="date"
              value={importWeek}
              onChange={e => setImportWeek(e.target.value)}
              className="border border-[#333333] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#E21D1D] bg-surface-alt text-white"
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 block mb-1">Region</label>
            <select
              value={importRegion}
              onChange={e => setImportRegion(e.target.value as 'domestic' | 'global')}
              className="border border-[#333333] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#E21D1D] bg-surface-alt text-white"
            >
              <option value="domestic">🇺🇸 US Domestic</option>
              <option value="global">🌍 Global</option>
            </select>
          </div>
        </div>

        <textarea
          value={importJson}
          onChange={e => setImportJson(e.target.value)}
          placeholder={EXAMPLE_JSON}
          rows={14}
          className="w-full border border-[#333333] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#E21D1D] bg-[#111111] text-white/80 resize-y mb-4"
        />

        {importResult && (
          <p className="text-[11px] font-bold text-emerald-400 mb-3">{importResult}</p>
        )}

        <button
          onClick={submitBulkImport}
          disabled={importing || !importWeek || !importJson.trim()}
          className="w-full bg-[#E21D1D] text-white text-sm font-black uppercase tracking-widest py-3 rounded-xl hover:bg-red-700 disabled:opacity-40 transition-colors"
        >
          {importing ? 'Importing…' : 'Submit'}
        </button>
      </div>

      {/* ── Existing weeks (read-only) ── */}
      <div className="mb-4">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">
          {weeks.length} weeks on record
        </h2>
        <div className="flex gap-2 flex-wrap">
          {weeks.map(week => (
            <button key={week} onClick={() => setSelectedWeek(selectedWeek === week ? '' : week)}
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors ${
                selectedWeek === week
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-[#333333] text-white/50 hover:border-gray-400'
              }`}>
              {fmtWeek(week)}
            </button>
          ))}
          {weeks.length === 0 && (
            <p className="text-sm text-white/40 font-bold">No data yet</p>
          )}
        </div>
      </div>

      {selectedWeek && (
        <div className="bg-surface border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
            <p className="text-sm font-black text-white">Week of {fmtWeek(selectedWeek)}</p>
            <button onClick={() => deleteWeek(selectedWeek)}
              className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-red-500 transition-colors px-3 py-1 rounded border border-[#2A2A2A] hover:border-red-200">
              Delete week
            </button>
          </div>

          {loadingWeek ? (
            <p className="text-sm text-white/40 font-bold py-6 text-center">Loading…</p>
          ) : (
            [{ label: '🇺🇸 Domestic', entries: domestic }, { label: '🌍 Global', entries: global }].map(({ label, entries }) => {
              const sorted = [...entries].sort((a, b) => a.rank - b.rank);
              return sorted.length === 0 ? null : (
                <div key={label}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30 px-5 pt-4 pb-1">{label}</p>
                  {sorted.map((entry, i) => (
                    <div key={entry.id} className={`flex items-center gap-3 px-5 py-2.5 ${i < sorted.length - 1 ? 'border-b border-[#1E1E1E]' : ''}`}>
                      <span className="text-sm font-black text-white/30 w-4 tabular-nums shrink-0">{entry.rank}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-black text-white">{entry.title}</span>
                        {entry.is_new && <span className="ml-2 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#E21D1D] text-white">NEW</span>}
                        {!entry.movie_id && <span className="ml-2 text-[9px] font-bold text-amber-500">⚠ unmatched</span>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-white">${entry.weekend_gross}M</p>
                        <p className="text-[10px] text-white/30 font-bold">${entry.total_gross}M total</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Lists Tab ─────────────────────────────────────────────────────────────────

interface Chart {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  is_featured: boolean;
  published_at: string;
  chart_entries: ChartEntry[];
}

interface ChartEntry {
  id: number;
  chart_id: number;
  title: string;
  year: number | null;
  rank: number;
  poster_url: string | null;
  quote: string | null;
  movie_id: number | null;
}


function ListsTab() {
  return <ListsEditor />;
}

// ── Review Health Tab ─────────────────────────────────────────────────────────

type ActionResult = { processed?: number; enriched?: number; removed?: number; failed?: number; reset?: number; tip?: string; message?: string; error?: string };

function ResultCard({ result }: { result: ActionResult }) {
  if (result.error) return (
    <div className="border border-red-500/30 bg-red-500/5 rounded-xl px-4 py-3">
      <p className="text-xs text-red-400 font-mono">{result.error}</p>
    </div>
  );
  if (result.reset !== undefined) return (
    <div className="border border-[#2A2A2A] bg-[#111] rounded-xl px-4 py-3">
      <p className="text-sm font-black text-emerald-400">{result.reset} bad snippet{result.reset !== 1 ? 's' : ''} cleared</p>
      {result.message && <p className="text-xs text-white/40 mt-0.5">{result.message}</p>}
      {result.tip && <p className="text-xs text-white/40 mt-0.5">{result.tip}</p>}
    </div>
  );
  return (
    <div className="border border-[#2A2A2A] bg-[#111] rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {([
          { label: 'Processed', value: result.processed ?? 0, color: 'text-white' },
          { label: 'Classified', value: result.enriched ?? 0, color: 'text-emerald-400' },
          { label: 'Removed', value: result.removed ?? 0, color: 'text-red-400' },
          { label: 'Failed', value: result.failed ?? 0, color: 'text-amber-400' },
        ] as const).map(({ label, value, color }) => (
          <div key={label} className="bg-[#1a1a1a] rounded-lg p-3 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      {result.tip && <p className="text-xs text-white/40">{result.tip}</p>}
    </div>
  );
}

function ReviewHealthTab({ creators }: { creators: Creator[] }) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ActionResult>>({});
  const [channelFilter, setChannelFilter] = useState('');

  const loading = activeAction !== null;

  async function run(actionKey: string, fn: () => Promise<ActionResult>) {
    setActiveAction(actionKey);
    setResults(prev => ({ ...prev, [actionKey]: {} }));
    try {
      const result = await fn();
      setResults(prev => ({ ...prev, [actionKey]: result }));
    } catch (e: any) {
      setResults(prev => ({ ...prev, [actionKey]: { error: e.message } }));
    }
    setActiveAction(null);
  }

  const channelName = creators.find(c => c.id === channelFilter)?.name ?? 'all channels';

  const actions = [
    {
      key: 'score-new',
      title: 'Score new reviews',
      description: 'Classifies the next 200 unscored reviews — most recent first. Each run advances the queue, so you can keep clicking until all reviews are caught up. Safe to run repeatedly.',
      buttonLabel: 'Next 200',
      buttonClass: 'bg-[#E21D1D] text-white hover:bg-[#c01919]',
      fn: async () => {
        const params = new URLSearchParams({ limit: '200' });
        if (channelFilter) params.set('creator_id', channelFilter);
        const res = await fetch(`/api/backfill?${params}`);
        return res.json();
      },
    },
    {
      key: 'fix-channel',
      title: 'Re-classify a channel',
      description: 'Forces the AI to re-read every review for the selected channel and re-score it. Use this after a prompt fix to correct wrong thumbs up/down across a whole channel.',
      buttonLabel: channelFilter ? `Re-run ${channelName}` : 'Select a channel first',
      buttonClass: 'bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-30',
      disabled: !channelFilter,
      fn: async () => {
        const res = await fetch(`/api/backfill?force=true&creator_id=${channelFilter}&limit=200`);
        return res.json();
      },
    },
    {
      key: 'fix-snippets',
      title: 'Fix bad snippets',
      description: 'Some reviews show junk like "WAYS TO SUPPORT THIS CHANNEL" instead of a real verdict quote. This finds those, clears them, and immediately re-classifies them.',
      buttonLabel: 'Find & fix bad snippets',
      buttonClass: 'bg-[#1a1a1a] text-white/70 hover:text-white border border-[#333]',
      fn: async () => {
        // Step 1: reset bad snippets
        const body = channelFilter ? { creator_id: channelFilter } : {};
        const resetRes = await fetch('/api/admin/reset-bad-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const resetData = await resetRes.json();
        if (!resetData.success || resetData.reset === 0) return resetData;

        // Step 2: immediately backfill the newly-cleared reviews
        const params = new URLSearchParams({ limit: String(Math.min(resetData.reset + 10, 200)) });
        if (channelFilter) params.set('creator_id', channelFilter);
        const backfillRes = await fetch(`/api/backfill?${params}`);
        const backfillData = await backfillRes.json();
        return { ...backfillData, reset: resetData.reset };
      },
    },
    {
      key: 'seed-battle',
      title: 'Seed Battle of Critics',
      description: 'Generates battle pairs from existing reviews and inserts seed votes so the Leaderboard shows W/L records from day one. Safe to run multiple times — only adds votes where the count is still below the minimum threshold. Requires reviews with both pro and con verdicts, valid snippets, and creator avatars.',
      buttonLabel: 'Seed leaderboard',
      buttonClass: 'bg-[#1a1a1a] text-white/70 hover:text-white border border-[#333]',
      fn: async () => {
        const res = await fetch('/api/admin/seed-battle', { method: 'POST' });
        const data = await res.json();
        if (!data.success) return { error: data.error };
        return {
          processed: data.matchupsTotal,
          enriched: data.matchupsSeeded,
          removed: 0,
          failed: 0,
          tip: `Generated ${data.pairsGenerated} pair(s) · inserted ${data.votesInserted} seed votes across ${data.matchupsSeeded} matchup(s)`,
        };
      },
    },
  ];

  return (
    <div className="max-w-2xl space-y-3">
      {/* Channel filter — shared across all actions */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-xs font-black uppercase tracking-widest text-white/40 shrink-0">Channel</label>
        <select
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value)}
          className="bg-[#1a1a1a] border border-[#333] text-white text-xs font-bold rounded-lg px-3 py-2 flex-1"
        >
          <option value="">All channels</option>
          {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {actions.map(({ key, title, description, buttonLabel, buttonClass, disabled, fn }) => (
        <div key={key} className="bg-[#111] border border-[#2A2A2A] rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white">{title}</p>
              <p className="text-xs text-white/40 mt-1 leading-relaxed">{description}</p>
            </div>
            <button
              onClick={() => run(key, fn)}
              disabled={loading || disabled}
              className={`shrink-0 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-colors disabled:opacity-40 ${buttonClass}`}
            >
              {activeAction === key ? 'Running…' : buttonLabel}
            </button>
          </div>
          {results[key] && Object.keys(results[key]).length > 0 && (
            <div className="mt-4">
              <ResultCard result={results[key]} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<'channels' | 'pending' | 'reviews' | 'add' | 'sync' | 'lists' | 'boxoffice' | 'health'>('pending');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [handle, setHandle] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [channelAction, setChannelAction] = useState<Record<string, 'syncing' | 'wiping' | 'backfilling'>>({});
  const [channelStatus, setChannelStatus] = useState<Record<string, string>>({});
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});

  async function runAction(label: string, url: string, method = 'GET') {
    setActionLoading(label);
    setActionStatus(`Running ${label}...`);
    try {
      const res = await fetch(url, { method });
      const data = await res.json();
      setActionStatus(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setActionStatus(`Error: ${e.message}`);
    }
    setActionLoading(null);
  }

  async function deepSyncChannel(creatorId: string, creatorName: string) {
    setChannelAction(prev => ({ ...prev, [creatorId]: 'syncing' }));
    setChannelStatus(prev => ({ ...prev, [creatorId]: 'Syncing...' }));
    try {
      const res = await fetch(`/api/deep-sync?creator=${encodeURIComponent(creatorId)}`);
      const data = await res.json();
      setChannelStatus(prev => ({
        ...prev,
        [creatorId]: `+${data.added ?? 0} reviews added · ${data.skipped ?? 0} skipped`,
      }));
    } catch (e: any) {
      setChannelStatus(prev => ({ ...prev, [creatorId]: `Error: ${e.message}` }));
    }
    setChannelAction(prev => { const n = { ...prev }; delete n[creatorId]; return n; });
  }

  async function wipeChannel(creatorId: string, creatorName: string) {
    if (!confirm(`Delete all reviews for ${creatorName}? This cannot be undone.`)) return;
    setChannelAction(prev => ({ ...prev, [creatorId]: 'wiping' }));
    setChannelStatus(prev => ({ ...prev, [creatorId]: 'Wiping...' }));
    try {
      const res = await fetch('/api/admin/wipe-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: creatorId }),
      });
      const data = await res.json();
      setChannelStatus(prev => ({
        ...prev,
        [creatorId]: `Deleted ${data.deleted ?? 0} reviews`,
      }));
      await refreshCounts();
    } catch (e: any) {
      setChannelStatus(prev => ({ ...prev, [creatorId]: `Error: ${e.message}` }));
    }
    setChannelAction(prev => { const n = { ...prev }; delete n[creatorId]; return n; });
  }

  async function backfillChannel(creatorId: string) {
    setChannelAction(prev => ({ ...prev, [creatorId]: 'backfilling' }));
    let totalEnriched = 0, totalRemoved = 0, totalNoContent = 0, totalFailed = 0, pass = 0;
    try {
      // Auto-loop until the API says there's nothing left to process
      while (true) {
        pass++;
        setChannelStatus(prev => ({
          ...prev,
          [creatorId]: `Backfilling pass ${pass}… scored so far: ${totalEnriched}`,
        }));
        const res = await fetch(`/api/backfill?creator_id=${encodeURIComponent(creatorId)}`);
        const data = await res.json();
        if (!data.success) {
          setChannelStatus(prev => ({ ...prev, [creatorId]: `Error: ${data.error}` }));
          break;
        }
        totalEnriched  += data.enriched   ?? 0;
        totalRemoved   += data.removed    ?? 0;
        totalNoContent += data.noContent  ?? 0;
        totalFailed    += data.failed     ?? 0;
        // Stop when there's nothing left or the API says all done
        if (!data.processed || data.tip !== 'There may be more — run again to continue') break;
      }
      setChannelStatus(prev => ({
        ...prev,
        [creatorId]: `✓ Scored ${totalEnriched} · Removed ${totalRemoved} · No content ${totalNoContent} · Failed ${totalFailed}`,
      }));
      await refreshCounts();
    } catch (e: any) {
      setChannelStatus(prev => ({ ...prev, [creatorId]: `Error: ${e.message}` }));
    }
    setChannelAction(prev => { const n = { ...prev }; delete n[creatorId]; return n; });
  }

  async function load() {
    const [creatorsRes, countsRes] = await Promise.all([
      fetch('/api/admin/creators'),
      fetch('/api/admin/pending-counts'),
    ]);
    const creatorsData = await creatorsRes.json();
    const countsData = await countsRes.json();
    setCreators(Array.isArray(creatorsData) ? creatorsData : []);
    setPendingCounts(countsData.counts ?? {});
  }

  async function refreshCounts() {
    const res = await fetch('/api/admin/pending-counts');
    const data = await res.json();
    setPendingCounts(data.counts ?? {});
  }

  useEffect(() => { load(); }, []);

  async function addCreator(e: React.FormEvent) {
    e.preventDefault();
    if (!handle.trim()) return;
    setLoading(true);
    setStatus('Looking up channel...');
    const res = await fetch('/api/admin/creators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: handle.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setStatus(`✓ Added: ${data.name}`);
      setHandle('');
      load();
    } else {
      setStatus(`✗ ${data.error}`);
    }
    setLoading(false);
  }

  async function removeCreator(creator: Creator) {
    if (!confirm(`Remove ${creator.name} and all their reviews?`)) return;
    const res = await fetch('/api/admin/creators', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: creator.id }),
    });
    const data = await res.json();
    if (data.success) {
      setStatus(`Removed ${creator.name}`);
      load();
    } else {
      setStatus(`✗ ${data.error}`);
    }
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10">
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Admin</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 border-b border-[#2A2A2A]">
        {([
          { key: 'pending', label: 'Score Reviews', accent: 'border-[#E21D1D]' },
          { key: 'sync', label: 'Sync & Backfill', accent: 'border-emerald-500' },
          { key: 'reviews', label: 'All Reviews', accent: 'border-white/40' },
          { key: 'add', label: '+ Add Review', accent: 'border-white/40' },
          { key: 'channels', label: 'Channels', accent: 'border-white/40' },
          { key: 'lists', label: '📋 Lists', accent: 'border-white/40' },
          { key: 'boxoffice', label: '🎬 Box Office', accent: 'border-white/40' },
          { key: 'health', label: '🩺 Health', accent: 'border-amber-500' },
        ] as const).map(({ key, label, accent }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${
              tab === key
                ? `border-b-2 ${accent} text-white -mb-px`
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Channels tab ── */}
      {tab === 'channels' && (
        <>
          <p className="text-sm text-white/40 font-bold uppercase tracking-widest mb-8">{creators.length} channels</p>

          <div className="bg-surface border border-[#2A2A2A] rounded-xl p-4 mb-6 shadow-sm flex items-center gap-4">
            <p className="text-[11px] text-white/40 font-bold flex-1">
              Sync new reviews and backfill snippets from the <strong className="text-white/70">Sync & Backfill</strong> tab.
            </p>
            <button onClick={() => runAction('Wipe', '/api/admin/wipe', 'POST')}
              disabled={actionLoading !== null}
              className="bg-red-900 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-red-950 disabled:opacity-50 shrink-0">
              {actionLoading === 'Wipe' ? 'Wiping...' : '⚠️ Wipe All Reviews'}
            </button>
            {actionStatus && (
              <pre className="mt-4 text-xs font-mono bg-surface border border-[#2A2A2A] rounded p-3 overflow-x-auto whitespace-pre-wrap text-ink/70">
                {actionStatus}
              </pre>
            )}
          </div>

          <div className="bg-surface border border-[#2A2A2A] rounded-xl p-6 mb-8 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest mb-4">Add Channel</h2>
            <form onSubmit={addCreator} className="flex gap-3">
              <input value={handle} onChange={e => setHandle(e.target.value)}
                placeholder="YouTube handle (e.g. jeremyjahns or @jeremyjahns)"
                className="flex-1 border border-[#333333] rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:border-[#E21D1D] bg-surface-alt text-white" />
              <button type="submit" disabled={loading}
                className="bg-[#E21D1D] text-white text-sm font-black uppercase tracking-widest px-6 py-2 rounded-lg hover:bg-surface/90 disabled:opacity-50">
                {loading ? '...' : 'Add'}
              </button>
            </form>
            {status && (
              <p className={`mt-3 text-sm font-bold ${status.startsWith('✓') ? 'text-emerald-600' : status.startsWith('✗') ? 'text-red-600' : 'text-white/50'}`}>
                {status}
              </p>
            )}
          </div>

          <div className="flex flex-col divide-y divide-[#2A2A2A] bg-surface border border-[#2A2A2A] rounded-xl shadow-sm overflow-hidden">
            {creators.map(creator => {
              const busy = channelAction[creator.id];
              const result = channelStatus[creator.id];
              return (
                <div key={creator.id}>
                  <div className="flex items-center gap-4 px-6 py-4">
                    <img
                      src={creator.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=E21D1D&color=fff&size=80`}
                      alt={creator.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                      onError={e => { const img = e.target as HTMLImageElement; img.onerror = null; img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=E21D1D&color=fff&size=80`; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white text-sm">{creator.name}</p>
                      <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest">
                        @{creator.handle}{creator.content_types?.length ? ` · ${creator.content_types.join(', ')}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => deepSyncChannel(creator.id, creator.name)} disabled={!!busy}
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition-colors">
                        {busy === 'syncing' ? 'Syncing...' : 'Deep Sync'}
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => backfillChannel(creator.id)} disabled={!!busy}
                          className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded border border-amber-200 text-amber-600 hover:bg-amber-50 disabled:opacity-40 transition-colors">
                          {busy === 'backfilling' ? 'Backfilling...' : 'Backfill'}
                        </button>
                        {pendingCounts[creator.id] !== undefined && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                            pendingCounts[creator.id] === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {pendingCounts[creator.id] === 0 ? '✓' : pendingCounts[creator.id]}
                          </span>
                        )}
                      </div>
                      <button onClick={() => wipeChannel(creator.id, creator.name)} disabled={!!busy}
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded border border-[#2A2A2A] text-white/30 hover:text-red-500 hover:border-red-200 disabled:opacity-40 transition-colors">
                        {busy === 'wiping' ? 'Wiping...' : 'Wipe'}
                      </button>
                      <button onClick={() => removeCreator(creator)} disabled={!!busy}
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded border border-[#2A2A2A] text-white/30 hover:text-red-500 hover:border-red-200 disabled:opacity-40 transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                  {result && (
                    <p className={`px-6 pb-3 text-[11px] font-bold ${result.startsWith('Error') ? 'text-red-500' : 'text-emerald-600'}`}>
                      {result}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'pending' && <PendingReviewsTab />}
      {tab === 'sync' && <SyncTab />}
      {tab === 'reviews' && <ReviewsTab />}
      {tab === 'add' && <ManualAddTab creators={creators} />}
      {tab === 'lists' && <ListsTab />}
      {tab === 'boxoffice' && <BoxOfficeTab />}
      {tab === 'health' && <ReviewHealthTab creators={creators} />}
    </div>
  );
}
