'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface TelemetryData {
  timestamp: string;
  window_start_time?: string;
  window_reset_interval_sec?: number;
  http: {
    total: number;
    status_2xx: number;
    status_3xx: number;
    status_4xx: number;
    status_5xx: number;
    client_error_rate_pct: number;
    server_error_rate_pct: number;
    by_status_code: Record<string, number>;
  };
  database: {
    total_queries: number;
    slow_queries_count: number;
    total_query_time_ms: number;
    avg_query_time_ms: number;
    max_query_time_ms: number;
    pool_total_connections: number;
    pool_idle_connections: number;
    pool_waiting_clients: number;
  };
  worker: {
    is_running: boolean;
    poll_interval_ms: number;
    max_retries: number;
    last_poll_timestamp: string | null;
    total_jobs_processed: number;
    total_jobs_failed: number;
    consecutive_failures: number;
    pending_queue_length: number;
    dead_letter_queue_length: number;
  };
  system_status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  alarms: {
    high_5xx_server_errors: boolean;
    database_slow: boolean;
    worker_failing: boolean;
    dead_letter_queue_spike: boolean;
  };
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const fetchMetrics = async () => {
    try {
      const res = await api.admin.getMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
        if (res.simulation) setIsSimulating(res.simulation.isRunning);
        setError('');
        setAccessDenied(false);
      } else {
        if (res.error?.code === 'FORBIDDEN' || res.error?.code === 'UNAUTHORIZED') {
          setAccessDenied(true);
        } else {
          setError(res.error?.message || 'Failed to fetch telemetry metrics.');
        }
      }
    } catch (err: any) {
      if (err.message?.includes('403') || err.message?.includes('Access denied') || err.message?.includes('FORBIDDEN')) {
        setAccessDenied(true);
      } else {
        setError(err.message || 'Failed to connect to metrics endpoint.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSimulation = async () => {
    try {
      if (isSimulating) {
        await api.admin.stopSimulation();
        setIsSimulating(false);
      } else {
        await api.admin.startSimulation();
        setIsSimulating(true);
      }
      fetchMetrics();
    } catch (err: any) {
      console.error('Failed to toggle simulation:', err);
    }
  };

  const handleResetMetricsWindow = async () => {
    try {
      const res = await api.admin.resetMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err: any) {
      console.error('Failed to reset metrics window:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    if (!autoRefresh) return;
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading && !metrics) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading operational telemetry...</div>;
  }

  if (accessDenied) {
    return (
      <div style={{ maxWidth: '500px', margin: '4rem auto', padding: '2rem', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--card-bg)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔒</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '0.5rem' }}>403 Access Denied</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          You do not have administrative privileges to view operational system metrics.
        </p>
      </div>
    );
  }

  const statusColor = metrics?.system_status === 'HEALTHY' ? 'var(--accent-emerald)' : metrics?.system_status === 'DEGRADED' ? 'var(--accent-amber)' : 'var(--accent-rose)';
  const statusBg = metrics?.system_status === 'HEALTHY' ? 'var(--accent-emerald-bg)' : metrics?.system_status === 'DEGRADED' ? 'var(--accent-amber-bg)' : 'var(--accent-rose-bg)';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="page-header" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="badge" style={{ backgroundColor: statusBg, color: statusColor, fontSize: '0.85rem', padding: '4px 12px', border: `1px solid ${statusColor}` }}>
              SYSTEM STATUS: {metrics?.system_status || 'UNKNOWN'}
            </span>
            <span className="badge" style={{ backgroundColor: 'var(--accent-purple-bg)', color: 'var(--accent-purple)', fontSize: '0.8rem', padding: '4px 10px' }}>
              ⏱ Rolling 1-Minute Window (Resets every 60s)
            </span>
          </div>

          <h1 className="page-title" style={{ margin: '0.25rem 0' }}>Operational Telemetry Metrics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Live backend telemetry • Window started: {metrics?.window_start_time ? new Date(metrics.window_start_time).toLocaleTimeString() : 'N/A'} • Refreshed: {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : 'N/A'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleToggleSimulation}
              className={`btn ${isSimulating ? 'btn-danger' : 'btn-primary'} btn-sm`}
            >
              {isSimulating ? '⏹ Stop Load Traffic Simulation' : '⚡ Simulate System Load Traffic'}
            </button>
            <button onClick={handleResetMetricsWindow} className="btn btn-secondary btn-sm" title="Reset rolling counter window">
              🧹 Reset Window
            </button>
            <button onClick={fetchMetrics} className="btn btn-secondary btn-sm">
              🔄 Refresh
            </button>
          </div>

          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto-refresh (3s)
          </label>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'var(--accent-rose-bg)', color: 'var(--accent-rose)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Pure Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Card 1: HTTP Error Classification */}
        <div className="card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            HTTP Traffic & Errors
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-color)' }}>
            {metrics?.http.total || 0} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>reqs</span>
          </div>
          <div style={{ fontSize: '0.825rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>2xx Success:</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>{metrics?.http.status_2xx || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>4xx Client Error:</span>
              <strong style={{ color: 'var(--accent-amber)' }}>{metrics?.http.status_4xx || 0} ({metrics?.http.client_error_rate_pct || 0}%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>5xx Server Error:</span>
              <strong style={{ color: 'var(--accent-rose)' }}>{metrics?.http.status_5xx || 0} ({metrics?.http.server_error_rate_pct || 0}%)</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Database Query Performance */}
        <div className="card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Database Performance
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-color)' }}>
            {metrics?.database.avg_query_time_ms || 0} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>ms avg</span>
          </div>
          <div style={{ fontSize: '0.825rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total DB Queries:</span>
              <strong>{metrics?.database.total_queries || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Max Query Time:</span>
              <strong>{metrics?.database.max_query_time_ms || 0} ms</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Slow Queries (&gt;100ms):</span>
              <strong style={{ color: (metrics?.database.slow_queries_count || 0) > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                {metrics?.database.slow_queries_count || 0}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Worker Status */}
        <div className="card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Notification Worker
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: metrics?.worker.is_running ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
            {metrics?.worker.is_running ? '● ACTIVE' : '○ STOPPED'}
          </div>
          <div style={{ fontSize: '0.825rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Jobs Processed:</span>
              <strong>{metrics?.worker.total_jobs_processed || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Jobs Failed:</span>
              <strong>{metrics?.worker.total_jobs_failed || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Consecutive Errors:</span>
              <strong style={{ color: (metrics?.worker.consecutive_failures || 0) > 0 ? 'var(--accent-rose)' : 'var(--text-color)' }}>
                {metrics?.worker.consecutive_failures || 0}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 4: Queues & DLQ */}
        <div className="card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Queue & Dead-Letter (DLQ)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-color)' }}>
            {metrics?.worker.pending_queue_length || 0} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>pending</span>
          </div>
          <div style={{ fontSize: '0.825rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Dead-Letter Queue (DLQ):</span>
              <strong style={{ color: (metrics?.worker.dead_letter_queue_length || 0) > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                {metrics?.worker.dead_letter_queue_length || 0} failed
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Poll Interval:</span>
              <strong>{metrics?.worker.poll_interval_ms || 0} ms</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Max Retries:</span>
              <strong>{metrics?.worker.max_retries || 3} attempts</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
