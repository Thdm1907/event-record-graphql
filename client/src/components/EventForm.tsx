import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { RECORD_EVENT, GET_SITES } from '../graphql/operations';

interface FormValues {
  siteId: number;
  eventType: string;
  description: string;
  metadata: string;
}

export const EventForm: React.FC = () => {
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      eventType: 'LOGIN',
      description: 'Manual event logged from web UI',
      metadata: '{"source":"web-dashboard"}'
    }
  });

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: sitesData } = useQuery(GET_SITES);
  const [recordEvent, { loading }] = useMutation(RECORD_EVENT);

  const onSubmit = async (values: FormValues) => {
    setStatusMsg(null);
    try {
      const res = await recordEvent({
        variables: {
          input: {
            description: values.description,
            eventDateTime: new Date().toISOString(),
            eventType: values.eventType,
            metadata: values.metadata,
            siteId: Number(values.siteId)
          }
        }
      });
      setStatusMsg({
        type: 'success',
        text: `Event recorded successfully! (ID: ${res.data.recordEvent.id})`
      });
      reset();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Failed to record event'
      });
    }
  };

  const sites = sitesData?.sites || [];

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <h1 className="page-title">Submit Event</h1>
        <p className="page-subtitle">Record a new telemetry event into the pipeline</p>
      </div>

      {statusMsg && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            borderLeft: `4px solid ${statusMsg.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'}`
          }}
        >
          <p style={{ color: statusMsg.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {statusMsg.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card">
        <div className="form-group">
          <label className="form-label">Target Site</label>
          <select className="form-select" {...register('siteId', { required: true })}>
            {sites.map((s: any) => (
              <option key={s.siteId} value={s.siteId}>
                #{s.siteId} - {s.siteName} ({s.city})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Event Type</label>
          <select className="form-select" {...register('eventType', { required: true })}>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="PURCHASE">PURCHASE</option>
            <option value="SENSOR_ALERT">SENSOR_ALERT</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="AUDIT">AUDIT</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" {...register('description', { required: true })} />
        </div>

        <div className="form-group">
          <label className="form-label">JSON Metadata</label>
          <textarea
            className="form-input"
            rows={3}
            {...register('metadata', { required: true })}
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Submitting...' : 'Record Event'}
        </button>
      </form>
    </div>
  );
};
