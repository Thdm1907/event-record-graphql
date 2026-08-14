import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSubscription } from '@apollo/client';
import { Sidebar } from './components/Sidebar';
import { EventList } from './components/EventList';
import { SiteList } from './components/SiteList';
import { EventForm } from './components/EventForm';
import { EventFeed } from './components/EventFeed';
import { MetricsSummary } from './components/MetricsSummary';
import { ON_EVENT_RECORDED } from './graphql/operations';
import { Radio } from 'lucide-react';

export const App: React.FC = () => {
  const [toast, setToast] = useState<{ id: string; msg: string } | null>(null);

  const { data } = useSubscription(ON_EVENT_RECORDED);

  useEffect(() => {
    if (!data?.onEventRecorded) return;

    const event = data.onEventRecorded;
    setToast({
      id: event.id,
      msg: `[LIVE] ${event.eventType}: ${event.description} (Site #${event.siteId})`
    });

    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [data]);

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<MetricsSummary />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/sites" element={<SiteList />} />
            <Route path="/submit" element={<EventForm />} />
            <Route path="/live" element={<EventFeed />} />
            <Route path="/metrics" element={<MetricsSummary />} />
          </Routes>
        </main>

        {toast && (
          <div className="toast">
            <Radio size={18} style={{ color: 'var(--accent-blue)', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.msg}</span>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
