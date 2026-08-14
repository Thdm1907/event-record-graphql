import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_EVENTS } from '../graphql/operations';

export const EventList: React.FC = () => {
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, loading, error, refetch } = useQuery(GET_EVENTS, {
    variables: {
      skip: page * pageSize,
      take: pageSize
    },
    pollInterval: 5000
  });

  if (loading && !data) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading event records...</div>;
  }

  if (error) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--accent-red)' }}>
        <h3 style={{ color: 'var(--accent-red)', marginBottom: '0.5rem' }}>Error loading events</h3>
        <p style={{ color: 'var(--text-secondary)' }}>{error.message}</p>
        <button className="btn" style={{ marginTop: '1rem' }} onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const events = data?.events || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Event Records</h1>
        <p className="page-subtitle">Historical log of recorded system and telemetry events</p>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Event ID</th>
            <th>Type</th>
            <th>Description</th>
            <th>Site</th>
            <th>Date & Time</th>
            <th>Recorded At</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                No event records found.
              </td>
            </tr>
          ) : (
            events.map((e: any) => (
              <tr key={e.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-blue)' }}>
                  {e.id.slice(0, 8)}...
                </td>
                <td>
                  <span className={`badge badge-${e.eventType}`}>{e.eventType}</span>
                </td>
                <td>{e.description}</td>
                <td>
                  {e.site ? `${e.site.siteName} (${e.site.city})` : `Site #${e.siteId}`}
                </td>
                <td>{new Date(e.eventDateTime).toLocaleString()}</td>
                <td>{new Date(e.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button
          className="btn"
          disabled={page === 0}
          style={{ opacity: page === 0 ? 0.5 : 1 }}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Previous
        </button>
        <span style={{ color: 'var(--text-secondary)' }}>Page {page + 1}</span>
        <button
          className="btn"
          disabled={events.length < pageSize}
          style={{ opacity: events.length < pageSize ? 0.5 : 1 }}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};
