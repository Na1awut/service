/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Nexus Gateway — Production-ready API Gateway Dashboard
 * Features: Services (search/filter), API Keys, Analytics, Loading skeletons, Error states
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Server, Key, BarChart2, Plus, Trash2, Copy, Check,
  Terminal, Activity, Search, AlertCircle, RefreshCw,
  TrendingUp, TrendingDown, Zap, Clock, Shield, ChevronRight,
  Filter, Globe, Lock
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Service = {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  status?: 'healthy' | 'degraded' | 'down';
  latencyMs?: number;
};

type ApiKey = {
  key: string;
  label?: string;
  createdAt?: string;
  lastUsed?: string;
};

type AnalyticsStat = {
  label: string;
  value: string;
  change: number; // percentage change
  icon: React.ReactNode;
};

type TabId = 'services' | 'keys' | 'analytics';

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  POST:   'bg-violet-50  text-violet-700  ring-1 ring-violet-200',
  PUT:    'bg-amber-50   text-amber-700   ring-1 ring-amber-200',
  PATCH:  'bg-sky-50     text-sky-700     ring-1 ring-sky-200',
  DELETE: 'bg-rose-50    text-rose-700    ring-1 ring-rose-200',
};

const STATUS_COLORS: Record<string, string> = {
  healthy:  'bg-emerald-400',
  degraded: 'bg-amber-400',
  down:     'bg-rose-500',
};

// ─── Skeleton Components ──────────────────────────────────────────────────────

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-zinc-100 ${className}`} />
);

const ServiceCardSkeleton = () => (
  <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-3.5 w-3/5" />
      </div>
      <Skeleton className="h-6 w-14 rounded-full" />
    </div>
    <Skeleton className="h-10 w-full rounded-xl" />
  </div>
);

const KeyRowSkeleton = () => (
  <tr>
    <td className="px-6 py-4"><Skeleton className="h-4 w-64" /></td>
    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
    <td className="px-6 py-4"><Skeleton className="h-4 w-24 ml-auto" /></td>
    <td className="px-6 py-4 text-right"><Skeleton className="h-7 w-16 ml-auto rounded-lg" /></td>
  </tr>
);

// ─── Error Banner ─────────────────────────────────────────────────────────────

const ErrorBanner = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
    <AlertCircle className="w-4 h-4 shrink-0" />
    <span className="flex-1">{message}</span>
    <button
      onClick={onRetry}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors font-medium text-xs"
    >
      <RefreshCw className="w-3 h-3" /> Retry
    </button>
  </div>
);

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

const DeleteConfirmModal = ({
  keyValue,
  onConfirm,
  onCancel,
}: {
  keyValue: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900">Revoke API Key</h3>
          <p className="text-xs text-zinc-500">This action cannot be undone</p>
        </div>
      </div>
      <p className="text-sm text-zinc-600 mb-1">You are about to revoke:</p>
      <code className="block text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-700 mb-5 truncate">
        {keyValue}
      </code>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
        >
          Revoke Key
        </button>
      </div>
    </div>
  </div>
);

// ─── Services Tab ─────────────────────────────────────────────────────────────

const ServicesTab = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setServices(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const copyEndpoint = (endpoint: string) => {
    navigator.clipboard.writeText(endpoint);
    setCopiedId(endpoint);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const methods = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  const filtered = services.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.endpoint.toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === 'ALL' || s.method === methodFilter;
    return matchSearch && matchMethod;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Services</h2>
        <p className="text-zinc-500 mt-1 text-sm">Internal microservices accessible via the API Gateway.</p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search services, endpoints…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          <Filter className="w-4 h-4 text-zinc-400 ml-1" />
          {methods.map(m => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                methodFilter === m
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={fetchServices} />}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />)
          : filtered.length === 0
          ? (
            <div className="col-span-2 py-16 text-center text-zinc-400">
              <Globe className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No services match your search.</p>
            </div>
          )
          : filtered.map(service => (
            <div key={service.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-violet-200 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    {service.status && (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[service.status]}`} />
                    )}
                    <h3 className="font-semibold text-zinc-900 truncate">{service.name}</h3>
                  </div>
                  <p className="text-sm text-zinc-500 line-clamp-2">{service.description}</p>
                </div>
                <span className={`shrink-0 px-2.5 py-0.5 text-xs font-semibold rounded-full ${METHOD_COLORS[service.method] ?? 'bg-zinc-100 text-zinc-600'}`}>
                  {service.method}
                </span>
              </div>

              {service.latencyMs != null && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
                  <Clock className="w-3 h-3" />
                  <span>{service.latencyMs} ms avg</span>
                </div>
              )}

              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 group-hover:border-violet-200 transition-colors">
                <Terminal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <code className="text-xs font-mono text-zinc-600 flex-1 truncate">{service.endpoint}</code>
                <button
                  onClick={() => copyEndpoint(service.endpoint)}
                  className="p-1.5 text-zinc-400 hover:text-violet-600 transition-colors rounded-md hover:bg-violet-50"
                  title="Copy endpoint"
                >
                  {copiedId === service.endpoint
                    ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                    : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {!loading && !error && (
        <p className="text-xs text-zinc-400">
          Showing {filtered.length} of {services.length} services
        </p>
      )}
    </div>
  );
};

// ─── API Keys Tab ─────────────────────────────────────────────────────────────

const ApiKeysTab = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/keys');
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      // Support both string[] and ApiKey[]
      setApiKeys(
        Array.isArray(data)
          ? data.map((k: any) => typeof k === 'string' ? { key: k } : k)
          : []
      );
    } catch (e: any) {
      setError(e.message ?? 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const generateKey = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/keys', { method: 'POST' });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      const newKey: ApiKey = typeof data === 'string' ? { key: data } : { key: data.key, ...data };
      setApiKeys(prev => [newKey, ...prev]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate key');
    } finally {
      setGenerating(false);
    }
  };

  const deleteKey = async (key: string) => {
    try {
      await fetch(`/api/keys/${encodeURIComponent(key)}`, { method: 'DELETE' });
      setApiKeys(prev => prev.filter(k => k.key !== key));
    } catch (e: any) {
      setError(e.message ?? 'Failed to revoke key');
    } finally {
      setConfirmDelete(null);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {confirmDelete && (
        <DeleteConfirmModal
          keyValue={confirmDelete}
          onConfirm={() => deleteKey(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">API Keys</h2>
          <p className="text-zinc-500 mt-1 text-sm">Manage your access keys for the API Gateway.</p>
        </div>
        <button
          onClick={generateKey}
          disabled={generating}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-violet-200"
        >
          {generating
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <Plus className="w-4 h-4" />}
          {generating ? 'Generating…' : 'Generate Key'}
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchKeys} />}

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Key</th>
              <th className="px-6 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">Created</th>
              <th className="px-6 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <KeyRowSkeleton key={i} />)
              : apiKeys.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center">
                    <Lock className="w-7 h-7 mx-auto mb-3 text-zinc-300" />
                    <p className="text-zinc-400 text-sm">No API keys found.</p>
                    <p className="text-zinc-300 text-xs mt-1">Generate a key to get started.</p>
                  </td>
                </tr>
              )
              : apiKeys.map(({ key, createdAt, lastUsed }) => (
                <tr key={key} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <code className="font-mono text-xs text-zinc-700 bg-zinc-100 px-2 py-1 rounded-lg">
                      {key.length > 32 ? `${key.slice(0, 16)}••••${key.slice(-8)}` : key}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium ring-1 ring-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-400 hidden sm:table-cell">
                    {createdAt ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => copyKey(key)}
                        className="p-2 text-zinc-400 hover:text-violet-600 transition-colors rounded-lg hover:bg-violet-50"
                        title="Copy key"
                      >
                        {copiedKey === key ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(key)}
                        className="p-2 text-zinc-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                        title="Revoke key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Analytics Tab ────────────────────────────────────────────────────────────

type AnalyticsData = {
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  activeKeys: number;
  requestsChange: number;
  latencyChange: number;
  topServices: Array<{ name: string; requests: number; errorRate: number }>;
  recentErrors: Array<{ time: string; endpoint: string; status: number; message: string }>;
};

const AnalyticsTab = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e.message ?? 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const StatCard = ({
    label, value, change, icon
  }: { label: string; value: string; change: number; icon: React.ReactNode }) => (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
          {icon}
        </div>
      </div>
      {loading
        ? <Skeleton className="h-8 w-24 mb-2" />
        : <p className="text-2xl font-semibold text-zinc-900 mb-1">{value}</p>
      }
      {loading
        ? <Skeleton className="h-3 w-16" />
        : (
          <div className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}% vs last 24h
          </div>
        )
      }
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Analytics</h2>
        <p className="text-zinc-500 mt-1 text-sm">Gateway usage metrics and performance overview.</p>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchAnalytics} />}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={data ? data.totalRequests.toLocaleString() : '—'} change={data?.requestsChange ?? 0} icon={<Zap className="w-4 h-4" />} />
        <StatCard label="Success Rate" value={data ? `${data.successRate}%` : '—'} change={data ? data.successRate - 100 : 0} icon={<Shield className="w-4 h-4" />} />
        <StatCard label="Avg Latency" value={data ? `${data.avgLatencyMs} ms` : '—'} change={data?.latencyChange ?? 0} icon={<Clock className="w-4 h-4" />} />
        <StatCard label="Active Keys" value={data ? String(data.activeKeys) : '—'} change={0} icon={<Key className="w-4 h-4" />} />
      </div>

      {/* Top services */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 text-sm">Top Services by Traffic</h3>
          <BarChart2 className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="divide-y divide-zinc-100">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-2 flex-1 rounded-full" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))
            : data?.topServices.length
            ? data.topServices.map(svc => {
              const max = Math.max(...data.topServices.map(s => s.requests));
              const pct = max > 0 ? (svc.requests / max) * 100 : 0;
              return (
                <div key={svc.name} className="px-6 py-4 flex items-center gap-4">
                  <span className="text-sm text-zinc-700 w-44 truncate shrink-0">{svc.name}</span>
                  <div className="flex-1 bg-zinc-100 rounded-full h-1.5">
                    <div
                      className="bg-violet-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-zinc-900 w-14 text-right shrink-0">
                    {svc.requests.toLocaleString()}
                  </span>
                  {svc.errorRate > 0 && (
                    <span className="text-xs text-rose-500 w-16 text-right shrink-0">
                      {svc.errorRate}% err
                    </span>
                  )}
                </div>
              );
            })
            : (
              <div className="px-6 py-10 text-center text-zinc-400 text-sm">
                No traffic data available
              </div>
            )
          }
        </div>
      </div>

      {/* Recent errors */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 text-sm">Recent Errors</h3>
          <AlertCircle className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="divide-y divide-zinc-100">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-4 space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
            : data?.recentErrors?.length
            ? data.recentErrors.map((err, i) => (
              <div key={i} className="px-6 py-4 flex items-start gap-4">
                <span className="px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 rounded-md ring-1 ring-rose-200 shrink-0">
                  {err.status}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-zinc-700 truncate">{err.endpoint}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{err.message}</p>
                </div>
                <span className="text-xs text-zinc-400 shrink-0">{err.time}</span>
              </div>
            ))
            : (
              <div className="px-6 py-10 text-center text-emerald-500 text-sm flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                No errors in the last 24h
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};

// ─── Docs Tab ─────────────────────────────────────────────────────────────────

const DocsTab = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-gateway.example.com';
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const curlExample = `curl -X GET ${origin}/gateway/random \\
  -H "x-api-key: YOUR_API_KEY"`;

  const fetchExample = `fetch('${origin}/gateway/ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({ prompt: 'Write a haiku.' })
})
.then(res => res.json())
.then(console.log);`;

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative group">
      <div className="bg-zinc-900 rounded-xl p-4 overflow-x-auto">
        <pre className="text-sm text-zinc-300 font-mono leading-relaxed">{code}</pre>
      </div>
      <button
        onClick={() => copy(code, id)}
        className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
      >
        {copied === id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Documentation</h2>
        <p className="text-zinc-500 mt-1 text-sm">Learn how to integrate with the Nexus API Gateway.</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm divide-y divide-zinc-100">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">1</div>
            <h3 className="font-semibold text-zinc-900">Authentication</h3>
          </div>
          <p className="text-sm text-zinc-600">
            All requests must include your API key in the{' '}
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 text-xs font-mono">x-api-key</code> header.
          </p>
          <CodeBlock code={curlExample} id="curl" />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">2</div>
            <h3 className="font-semibold text-zinc-900">Example: AI Text Generation</h3>
          </div>
          <p className="text-sm text-zinc-600">
            POST to the <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-violet-700 text-xs font-mono">/gateway/ai</code> endpoint with a prompt.
          </p>
          <CodeBlock code={fetchExample} id="fetch" />
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">3</div>
            <h3 className="font-semibold text-zinc-900">Response Codes</h3>
          </div>
          <div className="space-y-2">
            {[
              { code: '200', desc: 'Request successful' },
              { code: '400', desc: 'Bad request — check your payload' },
              { code: '401', desc: 'Missing or invalid API key' },
              { code: '429', desc: 'Rate limit exceeded' },
              { code: '503', desc: 'Service temporarily unavailable' },
            ].map(r => (
              <div key={r.code} className="flex items-center gap-3 text-sm">
                <code className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                  r.code === '200'
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                }`}>{r.code}</code>
                <span className="text-zinc-600">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── App Shell ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'services',   label: 'Services',    icon: <Server className="w-4 h-4" /> },
  { id: 'keys',       label: 'API Keys',    icon: <Key className="w-4 h-4" /> },
  { id: 'analytics',  label: 'Analytics',   icon: <BarChart2 className="w-4 h-4" /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('services');

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-zinc-200 flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="p-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-violet-200">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight leading-none">Nexus Gateway</h1>
              <p className="text-[10px] text-zinc-400 mt-0.5">API Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-violet-600' : ''}>{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-violet-400" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-300" />
            <span className="text-xs text-zinc-400">Gateway online</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {activeTab === 'services'  && <ServicesTab />}
          {activeTab === 'keys'      && <ApiKeysTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {/* Docs is still accessible via URL or can be re-added to sidebar */}
        </div>
      </main>
    </div>
  );
}