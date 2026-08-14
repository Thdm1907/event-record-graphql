import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_METRICS_SUMMARY, GET_SITES, GET_EVENTS } from '../graphql/operations';

export const MetricsSummary: React.FC = () => {
  const { data: metricsData, loading: metricsLoading } = useQuery(GET_METRICS_SUMMARY);
  const { data: sitesData } = useQuery(GET_SITES);
  const { data: eventsData } = useQuery(GET_EVENTS, { variables: { skip: 0, take: 100 } });

  if (metricsLoading) return <div style={{ color: 'var(--text-secondary)' }}>Loading analytics summary...</div>;

  const eventTypes = metricsData?.distinctEventTypes || [];
  const countries = metricsData?.distinctCountries || [];
  const sitesCount = sitesData?.sites?.length || 0;
  const eventsCount = eventsData?.events?.length || 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics & Metrics</h1>
        <p className="page-subtitle">Aggregated breakdowns by event types and geographic distributions</p>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-title">Total Registered Sites</div>
          <div className="card-value">{sitesCount}</div>
        </div>
        <div className="card">
          <div className="card-title">Recent Events (Sample)</div>
          <div className="card-value">{eventsCount}</div>
        </div>
        <div className="card">
          <div className="card-title">Distinct Event Types</div>
          <div className="card-value">{eventTypes.length}</div>
        </div>
        <div className="card">
          <div className="card-title">Countries Covered</div>
          <div className="card-value">{countries.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Events by Type</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {eventTypes.map((t: any) => (
                <tr key={t.type}>
                  <td>
                    <span className={`badge badge-${t.type}`}>{t.type}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Sites by Country</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((c: any) => (
                <tr key={c.country}>
                  <td style={{ fontWeight: 500 }}>{c.country}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
