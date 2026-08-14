import React, { useState, useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import { ON_EVENT_RECORDED } from '../graphql/operations';

export const EventFeed: React.FC = () => {
  const [feed, setFeed] = useState<any[]>([]);

  const { data, loading, error } = useSubscription(ON_EVENT_RECORDED);

  useEffect(() => {
    if (data?.onEventRecorded) {
      setFeed((prev) => [data.onEventRecorded, ...prev.slice(0, 49)]); // keep last 50
    }
  }, [data]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Live Subscription Feed</h1>
        <p className="page-subtitle">Real-time WebSocket stream of recorded events (`onEventRecorded` subscription)</p>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: error ? 'var(--accent-red)' : 'var(--accent-green)',
            display: 'inline-block'
          }}
        />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {error ? `Subscription error: ${error.message}` : loading ? 'Connecting WebSocket...' : 'Connected to live subscription feed'}
        </span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Description</th>
            <th>Site</th>
            <th>Event GUID</th>
          </tr>
        </thead>
        <tbody>
          {feed.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                Waiting for incoming events... Start the generator console app or submit an event to see live updates.
              </td>
            </tr>
          ) : (
            feed.map((e) => (
              <tr key={e.id} style={{ animation: 'fadeIn 0.3s ease' }}>
                <td>{new Date(e.createdAt).toLocaleTimeString()}</td>
                <td>
                  <span className={`badge badge-${e.eventType}`}>{e.eventType}</span>
                </td>
                <td style={{ fontWeight: 500 }}>{e.description}</td>
                <td>
                  {e.site ? `${e.site.siteName} (${e.site.city})` : `Site #${e.siteId}`}
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {e.eventGuid}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
