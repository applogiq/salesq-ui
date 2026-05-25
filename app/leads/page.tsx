'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Filter, Plus } from 'lucide-react';
import { leadsApi, type Lead, type LifecycleStage, type LeadListParams } from '@/lib/api.leads';
import LifecycleTabs from './components/LifecycleTabs';
import LeadsTable, { LeadsFilterBar } from './components/LeadsTable';
import LeadDetailPanel from './components/LeadDetailPanel';
import ImportModal from './components/ImportModal';
import AddLeadModal from './components/AddLeadModal';
import DuplicatesPanel from './components/DuplicatesPanel';

// ── Stage counts type ──────────────────────────────────────────────────────────
type StageCounts = Partial<Record<LifecycleStage | 'all', number>>;

export default function LeadsPage() {
  // ── Filter state ─────────────────────────────────────────────────────────────
  const [activeStage, setActiveStage] = useState<LifecycleStage | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  // ── Data state ───────────────────────────────────────────────────────────────
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [stageCounts, setStageCounts] = useState<StageCounts>({});
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // ── Modal state ───────────────────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);

  // ── Fetch leads ───────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: LeadListParams = {
        page,
        page_size: PAGE_SIZE,
        sort: 'created_at',
        order: 'desc',
      };
      if (activeStage) params.stage = activeStage;
      if (search.trim()) params.search = search.trim();

      const data = await leadsApi.list(params);
      setLeads(data.items);
      setTotal(data.total);

      // Auto-select first lead when list changes
      if (data.items.length > 0 && !selectedLead) {
        setSelectedLead(data.items[0]);
      }
    } catch {
      setLeads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activeStage, search, page]);

  // ── Fetch stage counts for tab badges ─────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const all = await leadsApi.list({ page: 1, page_size: 1 });
      const counts: StageCounts = { all: all.total };

      const stages: LifecycleStage[] = [
        'new','attempted','connected','interested','qualified',
        'proposal_sent','negotiation','converted','lost','dnd',
      ];
      await Promise.all(
        stages.map(async (s) => {
          const r = await leadsApi.list({ stage: s, page: 1, page_size: 1 });
          counts[s] = r.total;
        }),
      );
      setStageCounts(counts);

      // Duplicate count from dnd-flagged or explicit endpoint
      const dupes = await leadsApi.list({ page: 1, page_size: 1, dnd: undefined });
      // Use the duplicates endpoint count separately
      try {
        const dupeList = await leadsApi.duplicates(1);
        setDuplicateCount(dupeList.length);
      } catch { setDuplicateCount(0); }
    } catch {}
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [activeStage, search]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleLeadUpdated = (updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setSelectedLead(updated);
    fetchCounts();
  };

  const handleImportStarted = (_batchId: string) => {
    // Keep modal open for progress; after done it will show summary
  };

  const handleImportClosed = () => {
    setImportOpen(false);
    // Refresh data after import
    fetchLeads();
    fetchCounts();
  };

  const handleLeadCreated = () => {
    fetchLeads();
    fetchCounts();
  };

  const handleDuplicatesResolved = () => {
    fetchLeads();
    fetchCounts();
  };

  // ── Summary line ──────────────────────────────────────────────────────────────
  const qualified = stageCounts['qualified'] ?? 0;
  const dndCount  = stageCounts['dnd'] ?? 0;

  return (
    <div className="flex flex-col h-full gap-3">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-base font-semibold text-slate-900">Leads &amp; CRM</h1>
          <p className="text-xs text-slate-500">
            {total.toLocaleString()} leads · {qualified.toLocaleString()} qualified · {dndCount.toLocaleString()} DND
          </p>
        </div>

        {/* Global search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, phone, email…"
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-64 bg-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        <button
          onClick={() => leadsApi.exportCsv({ stage: activeStage ?? undefined })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>

        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600"
        >
          <Filter className="w-3.5 h-3.5" /> Import CSV
        </button>

        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold"
        >
          <Plus className="w-3.5 h-3.5" /> Add Lead
        </button>
      </div>

      {/* ── Lifecycle Tabs ── */}
      <LifecycleTabs
        activeStage={activeStage}
        counts={stageCounts}
        onChange={(s) => { setActiveStage(s); setPage(1); }}
      />

      {/* ── Main split ── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Left: table + filter bar */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col min-w-0 overflow-hidden">
          <LeadsFilterBar
            search={search}
            onSearch={setSearch}
            duplicateCount={duplicateCount}
            onShowDuplicates={() => setDuplicatesOpen(true)}
          />
          <LeadsTable
            leads={leads}
            selectedId={selectedLead?.id ?? null}
            onSelect={setSelectedLead}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            loading={loading}
          />
        </div>

        {/* Right: detail panel */}
        {selectedLead && (
          <LeadDetailPanel
            lead={selectedLead}
            onLeadUpdated={handleLeadUpdated}
          />
        )}
      </div>

      {/* ── Modals ── */}
      {importOpen && (
        <ImportModal
          onClose={handleImportClosed}
          onImportStarted={handleImportStarted}
        />
      )}
      {addOpen && (
        <AddLeadModal
          onClose={() => setAddOpen(false)}
          onCreated={handleLeadCreated}
        />
      )}
      {duplicatesOpen && (
        <DuplicatesPanel
          onClose={() => setDuplicatesOpen(false)}
          onResolved={handleDuplicatesResolved}
        />
      )}
    </div>
  );
}
