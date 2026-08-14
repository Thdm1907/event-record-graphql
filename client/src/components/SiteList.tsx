import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_SITES } from '../graphql/operations';

export const SiteList: React.FC = () => {
  const { data, loading, error, refetch } = useQuery(GET_SITES);

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading sites list...</div>;
  if (error) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--accent-red)' }}>
        <h3 style={{ color: 'var(--accent-red)' }}>Failed to load sites</h3>
        <p>{error.message}</p>
        <button className="btn" style={{ marginTop: '1rem' }} onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const sites = data?.sites || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Registered Sites</h1>
        <p className="page-subtitle">Facilities and locations registered in the system</p>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Site Name</th>
            <th>Address</th>
            <th>City</th>
            <th>State</th>
            <th>Country</th>
            <th>Postal Code</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((s: any) => (
            <tr key={s.siteId}>
              <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>#{s.siteId}</td>
              <td style={{ fontWeight: 600 }}>{s.siteName}</td>
              <td>{s.addressLine1} {s.addressLine2 || ''}</td>
              <td>{s.city}</td>
              <td>{s.state}</td>
              <td>{s.country}</td>
              <td>{s.postalCode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
