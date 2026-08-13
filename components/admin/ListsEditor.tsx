'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type SearchResult = {
  id: number;
  title: string;
  type: 'movie' | 'tv';
  poster_path: string | null;
  year: string | null;
};

type ListRow = {
  localId: string;
  movieId: number | null;
  movieTitle: string;
  movieYear: string | null;
  moviePosterPath: string | null;
  oneLiner: string;
  customImageUrl: string | null;
  // transient search state
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  showDropdown: boolean;
};

type ChartData = {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  category_tags: string[] | null;
  status: string | null;
  is_featured: boolean;
  published_at: string | null;
  created_at: string | null;
  chart_entries: EntryData[];
};

type EntryData = {
  id: number;
  rank: number;
  title: string;
  year: string | null;
  poster_url: string | null;
  quote: string | null;
  movie_id: number | null;
  custom_image_url: string | null;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  'CASTING', 'PERFORMANCE', 'FRANCHISE', 'HORROR', 'COMEDY',
  'DRAMA', 'DIRECTORS', 'DECADE', 'INDUSTRY', 'OTHER',
];

const ONE_LINER_MAX = 120;
const AUTO_SAVE_INTERVAL = 60_000; // 60s

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyRow(): ListRow {
  return {
    localId:         uid(),
    movieId:         null,
    movieTitle:      '',
    movieYear:       null,
    moviePosterPath: null,
    oneLiner:        '',
    customImageUrl:  null,
    searchQuery:     '',
    searchResults:   [],
    isSearching:     false,
    showDropdown:    false,
  };
}

function rowsFromEntries(entries: EntryData[]): ListRow[] {
  return [...entries]
    .sort((a, b) => a.rank - b.rank)
    .map(e => ({
      localId:         uid(),
      movieId:         e.movie_id,
      movieTitle:      e.title,
      movieYear:       e.year,
      moviePosterPath: e.poster_url
        ? e.poster_url.replace('https://image.tmdb.org/t/p/w185', '')
        : null,
      oneLiner:        e.quote ?? '',
      customImageUrl:  e.custom_image_url,
      searchQuery:     '',
      searchResults:   [],
      isSearching:     false,
      showDropdown:    false,
    }));
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ImageUploadZone({
  currentUrl,
  preview,
  onUploaded,
  onPreview,
  label = 'Cover artwork',
  height = 140,
}: {
  currentUrl: string | null;
  preview: string | null;
  onUploaded: (url: string) => void;
  onPreview: (url: string | null) => void;
  label?: string;
  height?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const display = preview ?? currentUrl;

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    const objectUrl = URL.createObjectURL(file);
    onPreview(objectUrl);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const json = await res.json();
    setUploading(false);
    if (json.url) {
      onUploaded(json.url);
    } else {
      setError(json.error ?? 'Upload failed');
      onPreview(null);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">{label}</label>
      <div
        className="relative border border-dashed border-white/20 rounded-lg overflow-hidden cursor-pointer hover:border-white/40 transition-colors"
        style={{ height }}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
      >
        {display ? (
          <>
            <img src={display} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Replace</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            {uploading ? (
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Uploading…</span>
            ) : (
              <>
                <span className="text-[24px] text-white/20">⬆</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                  Drop or click — JPG / PNG / WEBP
                </span>
              </>
            )}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Uploading…</span>
          </div>
        )}
      </div>
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
    </div>
  );
}

function SmallImageUpload({
  currentUrl,
  onUploaded,
}: {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const json = await res.json();
    setUploading(false);
    if (json.url) onUploaded(json.url);
  }

  return (
    <div
      className="shrink-0 border border-dashed border-white/20 rounded cursor-pointer hover:border-white/40 transition-colors overflow-hidden flex items-center justify-center bg-[#1a1a1a]"
      style={{ width: 60, height: 80 }}
      onClick={() => inputRef.current?.click()}
    >
      {currentUrl ? (
        <img src={currentUrl} alt="" className="w-full h-full object-cover" />
      ) : uploading ? (
        <span className="text-[8px] text-white/30">…</span>
      ) : (
        <span className="text-[18px] text-white/20">+</span>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
    </div>
  );
}

// ── Movie search autocomplete ──────────────────────────────────────────────────

function MovieSearch({
  row,
  onSelect,
  onQueryChange,
  onClear,
  onBlur,
}: {
  row: ListRow;
  onSelect: (result: SearchResult) => void;
  onQueryChange: (q: string) => void;
  onClear: () => void;
  onBlur: () => void;
}) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInput(val: string) {
    onQueryChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) return;
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      // update results via parent — we rely on the parent updating row.searchResults
      // use a custom event to communicate back
      const event = new CustomEvent('listRowSearchResults', {
        detail: { localId: row.localId, results: data.results ?? [] },
      });
      window.dispatchEvent(event);
    }, 280);
  }

  // If a movie is already selected, show a confirmation tag
  if (row.movieId !== null || (row.movieTitle && !row.showDropdown)) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        {row.moviePosterPath && (
          <img
            src={`https://image.tmdb.org/t/p/w92${row.moviePosterPath}`}
            alt=""
            className="w-6 h-9 rounded object-cover shrink-0"
          />
        )}
        <span className="text-[13px] font-semibold text-white truncate">{row.movieTitle}</span>
        {row.movieYear && <span className="text-[11px] text-white/40 shrink-0">{row.movieYear}</span>}
        <button
          onClick={onClear}
          className="shrink-0 ml-auto text-[10px] font-black text-white/30 hover:text-white/70 transition-colors"
          title="Clear film selection"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={row.searchQuery}
        placeholder="Search for a film or show…"
        className="w-full bg-[#111] border border-white/10 rounded px-2.5 py-1.5 text-[13px] text-white placeholder-white/25 focus:outline-none focus:border-white/30"
        onChange={e => handleInput(e.target.value)}
        onBlur={() => { setTimeout(onBlur, 200); }}
      />
      {row.isSearching && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-white/30">…</span>
      )}
      {row.showDropdown && row.searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden shadow-2xl">
          {row.searchResults.map(r => (
            <button
              key={`${r.type}-${r.id}`}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.06] transition-colors text-left"
              onMouseDown={() => onSelect(r)}
            >
              {r.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} alt="" className="w-7 h-10 object-cover rounded shrink-0" />
              ) : (
                <div className="w-7 h-10 bg-[#333] rounded shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{r.title}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">{r.year ?? '—'} · {r.type}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── List row ───────────────────────────────────────────────────────────────────

function RowBuilder({
  row,
  rank,
  isDragging,
  isDragOver,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onBlur,
}: {
  row: ListRow;
  rank: number;
  isDragging: boolean;
  isDragOver: boolean;
  onUpdate: (patch: Partial<ListRow>) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onBlur: () => void;
}) {
  return (
    <div
      className="relative"
      draggable
      onDragStart={onDragStart}
      onDragOver={e => { e.preventDefault(); onDragOver(e); }}
      onDrop={onDrop}
      style={{
        opacity: isDragging ? 0.4 : 1,
        borderTop: isDragOver ? '2px solid #C8201F' : '2px solid transparent',
      }}
    >
      <div className="flex items-start gap-3 py-3 px-2 bg-[#141414] rounded-lg border border-white/[0.06] mb-2">

        {/* Drag handle */}
        <div
          className="shrink-0 flex flex-col gap-0.5 mt-3 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-70 transition-opacity"
          title="Drag to reorder"
        >
          {[0,1,2].map(i => (
            <div key={i} className="w-3.5 h-0.5 bg-white rounded-full" />
          ))}
        </div>

        {/* Rank badge */}
        <div
          className="shrink-0 w-7 h-7 rounded flex items-center justify-center font-black text-[13px] mt-2"
          style={{ background: rank === 1 ? '#C8201F' : '#222', color: rank === 1 ? 'white' : 'rgba(255,255,255,0.5)' }}
        >
          {rank}
        </div>

        {/* Custom image upload */}
        <SmallImageUpload
          currentUrl={row.customImageUrl}
          onUploaded={url => onUpdate({ customImageUrl: url })}
        />

        {/* Film search + one-liner */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <MovieSearch
            row={row}
            onSelect={r => onUpdate({
              movieId:         r.id,
              movieTitle:      r.title,
              movieYear:       r.year,
              moviePosterPath: r.poster_path,
              searchQuery:     '',
              showDropdown:    false,
              searchResults:   [],
            })}
            onQueryChange={q => onUpdate({ searchQuery: q, showDropdown: true })}
            onClear={() => onUpdate({ movieId: null, movieTitle: '', movieYear: null, moviePosterPath: null, searchQuery: '', showDropdown: false })}
            onBlur={onBlur}
          />
          <div className="relative">
            <input
              type="text"
              value={row.oneLiner}
              maxLength={ONE_LINER_MAX}
              placeholder="Your editorial one-liner for this entry"
              className="w-full bg-[#111] border border-white/10 rounded px-2.5 py-1.5 text-[12px] text-white placeholder-white/20 focus:outline-none focus:border-white/30 pr-14"
              onChange={e => onUpdate({ oneLiner: e.target.value })}
              onBlur={onBlur}
            />
            <span
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono tabular-nums"
              style={{ color: row.oneLiner.length > 100 ? 'rgba(200,32,31,0.8)' : 'rgba(255,255,255,0.2)' }}
            >
              {row.oneLiner.length}/{ONE_LINER_MAX}
            </span>
          </div>
        </div>

        {/* Remove */}
        <button
          onClick={onRemove}
          className="shrink-0 mt-2 text-[16px] text-white/20 hover:text-white/60 transition-colors leading-none"
          title="Remove this entry"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ── List editor form ───────────────────────────────────────────────────────────

function ListEditorForm({
  initial,
  onBack,
  onSaved,
}: {
  initial: ChartData | null; // null = new list
  onBack: () => void;
  onSaved: () => void;
}) {
  const [chartId, setChartId] = useState<number | null>(initial?.id ?? null);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '');
  const [coverUrl, setCoverUrl] = useState(initial?.image_url ?? '');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(initial?.category_tags ?? []);
  const [status, setStatus] = useState<'draft' | 'published'>((initial?.status as any) ?? 'draft');
  const [featured, setFeatured] = useState(initial?.is_featured ?? false);
  const [rows, setRows] = useState<ListRow[]>(() => {
    const entries = initial?.chart_entries ?? [];
    const base = entries.length > 0 ? rowsFromEntries(entries) : Array.from({ length: 10 }, emptyRow);
    return base;
  });

  const [saving, setSaving] = useState(false);
  const [savedLabel, setSavedLabel] = useState(false);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Drag-and-drop
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Listen for search results bubbled from MovieSearch via custom event
  useEffect(() => {
    function handle(e: Event) {
      const { localId, results } = (e as CustomEvent).detail;
      setRows(prev => prev.map(r =>
        r.localId === localId ? { ...r, searchResults: results, isSearching: false, showDropdown: results.length > 0 } : r
      ));
    }
    window.addEventListener('listRowSearchResults', handle);
    return () => window.removeEventListener('listRowSearchResults', handle);
  }, []);

  // Auto-save every 60 seconds if dirty
  useEffect(() => {
    const id = setInterval(() => { if (dirty) save(); }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(id);
  });

  function updateRow(localId: string, patch: Partial<ListRow>) {
    setDirty(true);
    setRows(prev => prev.map(r => r.localId === localId ? { ...r, ...patch } : r));
  }

  function removeRow(localId: string) {
    setDirty(true);
    setRows(prev => prev.filter(r => r.localId !== localId));
  }

  function addRow() {
    setDirty(true);
    setRows(prev => [...prev, emptyRow()]);
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(index: number) {
    setDragOverIndex(index);
  }

  function handleDrop(dropIndex: number) {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    setDirty(true);
    setRows(prev => {
      const next = [...prev];
      const moved = next.splice(dragIndex, 1)[0];
      if (!moved) return prev;
      next.splice(dropIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function flashSaved() {
    setSavedLabel(true);
    setTimeout(() => setSavedLabel(false), 2500);
  }

  const save = useCallback(async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError(null);

    // 1. Save/create the chart
    let id = chartId;
    if (!id) {
      const res = await fetch('/api/admin/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:        'create_chart',
          title:         title.trim(),
          subtitle:      subtitle.trim() || null,
          image_url:     coverUrl || null,
          category_tags: tags,
          is_featured:   featured,
          status:        'draft',
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? 'Save failed'); setSaving(false); return; }
      id = data.chart.id;
      setChartId(id);
    } else {
      const res = await fetch('/api/admin/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:        'update_chart',
          id,
          title:         title.trim(),
          subtitle:      subtitle.trim() || null,
          image_url:     coverUrl || null,
          category_tags: tags,
          is_featured:   featured,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? 'Save failed'); setSaving(false); return; }
    }

    // 2. Batch-save entries
    const entriesRes = await fetch('/api/admin/charts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action:   'upsert_entries',
        chart_id: id,
        entries:  rows.map((r, i) => ({
          rank:            i + 1,
          movieId:         r.movieId,
          movieTitle:      r.movieTitle,
          movieYear:       r.movieYear,
          moviePosterPath: r.moviePosterPath,
          oneLiner:        r.oneLiner,
          customImageUrl:  r.customImageUrl,
        })),
      }),
    });
    const entriesData = await entriesRes.json();
    if (!entriesData.success) { setError(entriesData.error ?? 'Entry save failed'); setSaving(false); return; }

    setSaving(false);
    setDirty(false);
    flashSaved();
    onSaved();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle, coverUrl, tags, featured, rows, chartId]);

  async function publish() {
    if (!chartId) { await save(); }
    const id = chartId;
    if (!id) return;
    const res = await fetch('/api/admin/charts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'publish_chart', id }),
    });
    const data = await res.json();
    if (data.success) { setStatus('published'); flashSaved(); }
    else setError(data.error ?? 'Publish failed');
    setPublishConfirm(false);
  }

  async function unpublish() {
    if (!chartId) return;
    const res = await fetch('/api/admin/charts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unpublish_chart', id: chartId }),
    });
    const data = await res.json();
    if (data.success) { setStatus('draft'); flashSaved(); }
    else setError(data.error ?? 'Unpublish failed');
    setPublishConfirm(false);
  }

  function handleBack() {
    if (dirty && !confirm('You have unsaved changes. Leave without saving?')) return;
    onBack();
  }

  return (
    <div>
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={handleBack}
          className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          ← All Lists
        </button>

        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {savedLabel && (
            <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Saved ✓</span>
          )}
          {error && (
            <span className="text-[10px] font-black text-red-400">{error}</span>
          )}

          <span
            className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded"
            style={{ background: status === 'published' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', color: status === 'published' ? '#4ade80' : 'rgba(255,255,255,0.4)' }}
          >
            {status === 'published' ? 'Published' : 'Draft'}
          </span>

          <button
            onClick={() => save()}
            disabled={saving}
            className="px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>

          {!publishConfirm ? (
            <button
              onClick={() => setPublishConfirm(true)}
              className="px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest text-white transition-colors"
              style={{ background: status === 'published' ? 'rgba(255,255,255,0.15)' : '#C8201F' }}
            >
              {status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded px-3 py-1.5">
              <span className="text-[10px] text-white/60">
                {status === 'published' ? 'Unpublish this list?' : 'Publish now — goes live immediately.'}
              </span>
              <button
                onClick={status === 'published' ? unpublish : publish}
                className="text-[10px] font-black text-[#C8201F] hover:text-white transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setPublishConfirm(false)}
                className="text-[10px] font-black text-white/30 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 1: Global details ─────────────────────────────── */}
      <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-5 mb-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">List Details</h3>

        <div className="grid grid-cols-1 gap-3 mb-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              placeholder="e.g. Screen Failures: 10 Roles That Should've Been Recast"
              className="w-full bg-[#111] border border-white/10 rounded px-3 py-2 text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              onChange={e => { setTitle(e.target.value); setDirty(true); }}
              onBlur={() => save()}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              placeholder="e.g. Hollywood's most painful miscasting moments"
              className="w-full bg-[#111] border border-white/10 rounded px-3 py-2 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              onChange={e => { setSubtitle(e.target.value); setDirty(true); }}
              onBlur={() => save()}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <ImageUploadZone
            currentUrl={coverUrl || null}
            preview={coverPreview}
            onUploaded={url => { setCoverUrl(url); setDirty(true); }}
            onPreview={url => setCoverPreview(url)}
            label="Cover artwork"
            height={140}
          />

          <div className="flex flex-col gap-3">
            {/* Category tags */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Category tags</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_OPTIONS.map(tag => {
                  const active = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        setDirty(true);
                        setTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag]);
                      }}
                      className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm transition-colors"
                      style={{
                        background: active ? '#C8201F' : 'rgba(255,255,255,0.06)',
                        color: active ? 'white' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Featured + status */}
            <div className="flex flex-col gap-2 mt-auto">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={e => { setFeatured(e.target.checked); setDirty(true); }}
                  className="accent-[#C8201F] w-4 h-4"
                />
                <span className="text-[12px] font-semibold text-white/70">Feature on homepage</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Row builder ────────────────────────────────── */}
      <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            Entries — {rows.length} {rows.length === 1 ? 'slot' : 'slots'}
          </h3>
          <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
            Drag to reorder · click custom image (+) for character art
          </span>
        </div>

        <div>
          {rows.map((row, index) => (
            <RowBuilder
              key={row.localId}
              row={row}
              rank={index + 1}
              isDragging={dragIndex === index}
              isDragOver={dragOverIndex === index}
              onUpdate={patch => updateRow(row.localId, patch)}
              onRemove={() => removeRow(row.localId)}
              onDragStart={() => handleDragStart(index)}
              onDragOver={() => handleDragOver(index)}
              onDrop={() => handleDrop(index)}
              onBlur={() => save()}
            />
          ))}
        </div>

        <button
          onClick={addRow}
          className="mt-3 w-full py-2.5 border border-dashed border-white/15 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 hover:border-white/30 transition-colors"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
}

// ── Lists index ────────────────────────────────────────────────────────────────

function ListsIndex({
  charts,
  loading,
  onNew,
  onEdit,
  onDelete,
}: {
  charts: ChartData[];
  loading: boolean;
  onNew: () => void;
  onEdit: (chart: ChartData) => void;
  onDelete: (chart: ChartData) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <span className="text-white font-black">
          <span className="text-white">{charts.length}</span>
          <span className="text-white/40 ml-1">{charts.length === 1 ? 'list' : 'lists'}</span>
        </span>
        <button
          onClick={onNew}
          className="px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest text-white transition-colors"
          style={{ background: '#C8201F' }}
        >
          + New List
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-white/40 font-bold py-8 text-center">Loading lists…</p>
      ) : charts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-[11px] font-black uppercase tracking-widest text-white/30">No lists yet — create one above</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {charts.map(chart => {
            const entryCount = chart.chart_entries?.length ?? 0;
            const isPublished = chart.status === 'published';
            return (
              <div
                key={chart.id}
                className="flex items-center gap-4 bg-[#141414] border border-white/[0.06] rounded-xl p-4"
              >
                {/* Cover thumbnail */}
                <div className="shrink-0 w-14 h-20 rounded overflow-hidden bg-[#1a1a1a]">
                  {chart.image_url && (
                    <img src={chart.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-bold text-white text-[14px] truncate">{chart.title}</span>
                    <span
                      className="shrink-0 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                      style={{ background: isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', color: isPublished ? '#4ade80' : 'rgba(255,255,255,0.35)' }}
                    >
                      {isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  {chart.subtitle && <p className="text-[12px] text-white/40 truncate">{chart.subtitle}</p>}
                  <p className="text-[10px] text-white/25 mt-1 uppercase tracking-widest font-bold">
                    {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                    {chart.category_tags?.length ? ' · ' + chart.category_tags.join(', ') : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {isPublished && (
                    <a
                      href={`/ranked/lists/${chart.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors px-2 py-1.5"
                    >
                      View ↗
                    </a>
                  )}
                  <button
                    onClick={() => onEdit(chart)}
                    className="px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest bg-white/[0.08] hover:bg-white/[0.14] text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(chart)}
                    className="px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export function ListsEditor() {
  const [view, setView] = useState<'index' | 'editor'>('index');
  const [editingChart, setEditingChart] = useState<ChartData | null>(null);
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCharts() {
    setLoading(true);
    const res = await fetch('/api/admin/charts');
    const data = await res.json();
    if (data.success) setCharts(data.charts ?? []);
    setLoading(false);
  }

  useEffect(() => { loadCharts(); }, []);

  function openNew() {
    setEditingChart(null);
    setView('editor');
  }

  function openEdit(chart: ChartData) {
    setEditingChart(chart);
    setView('editor');
  }

  function backToIndex() {
    setView('index');
    setEditingChart(null);
    loadCharts();
  }

  async function deleteChart(chart: ChartData) {
    if (!confirm(`Delete "${chart.title}" and all its entries? This cannot be undone.`)) return;
    await fetch('/api/admin/charts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_chart', id: chart.id }),
    });
    loadCharts();
  }

  if (view === 'editor') {
    return (
      <ListEditorForm
        initial={editingChart}
        onBack={backToIndex}
        onSaved={loadCharts}
      />
    );
  }

  return (
    <ListsIndex
      charts={charts}
      loading={loading}
      onNew={openNew}
      onEdit={openEdit}
      onDelete={deleteChart}
    />
  );
}
