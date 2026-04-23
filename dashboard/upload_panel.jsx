/* global React, window */
const { useState: useUpState, useEffect: useUpEffect, useRef: useUpRef } = React;

function UploadPanel() {
  const [open,      setOpen]      = useUpState(false);
  const [dragging,  setDragging]  = useUpState(false);
  const [uploading, setUploading] = useUpState(false);
  const [info,      setInfo]      = useUpState(null);
  const [msg,       setMsg]       = useUpState(null);
  const [backendUp, setBackendUp] = useUpState(false);
  const inputRef = useUpRef(null);

  // Probe backend on mount — if absent, we're on Vercel/static and uploads are disabled
  useUpEffect(() => {
    fetch('/api/status')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.status === 'ok') {
          setBackendUp(true);
          setInfo(d);
        }
      })
      .catch(() => { /* static mode — leave backendUp false */ });
  }, []);

  const upload = async (file) => {
    if (!file) return;
    if (!backendUp) {
      setMsg({ type: 'info', text: 'Live upload needs the local backend. Run: python backend/main.py' });
      return;
    }
    if (!file.name.match(/\.(csv|xlsx?)$/i)) {
      setMsg({ type: 'error', text: 'Please upload a CSV or Excel file.' });
      return;
    }
    setUploading(true);
    setMsg(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res  = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.status === 'ok') {
        setMsg({ type: 'ok', text: `✓ ${data.info.relevantPosts?.toLocaleString()} posts loaded — refreshing…` });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setMsg({ type: 'error', text: data.detail || 'Upload failed.' });
      }
    } catch (e) {
      setMsg({ type: 'info', text: 'Backend went offline. Run: python backend/main.py' });
    } finally {
      setUploading(false);
    }
  };

  const onFileInput = (e) => upload(e.target.files[0]);
  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    upload(e.dataTransfer.files[0]);
  };

  // On Vercel / any deployment without the FastAPI backend, hide the upload UI entirely
  if (!backendUp) return null;

  const pillLabel = info
    ? `${Number(info.relevantPosts).toLocaleString()} posts · ${(info.months || []).length}mo`
    : 'Upload CSV';

  return (
    <>
      {/* Floating pill button */}
      <button
        className="upload-pill"
        onClick={() => setOpen(o => !o)}
        title="Upload new CSV / Excel to refresh data"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          background: 'var(--accent)', color: '#fff',
          border: 'none', borderRadius: 999, padding: '8px 16px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 2px 12px oklch(0 0 0 / .25)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        {pillLabel}
      </button>

      {/* Drop zone panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 68, right: 24, zIndex: 1000,
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 20, width: 300,
          boxShadow: '0 8px 32px oklch(0 0 0 / .18)',
        }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            {backendUp ? 'Upload dataset' : 'Static deployment'}
          </div>
          {backendUp && info && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>
              Current: <b style={{ color: 'var(--text-2)' }}>{info.filename}</b>
              <br/>{Number(info.totalPosts).toLocaleString()} total · {Number(info.relevantPosts).toLocaleString()} relevant
            </div>
          )}
          {!backendUp && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
              Showing pre-computed data from<br/>
              <code style={{ fontSize: 10 }}>all_groups_final_v2_annotated.csv</code>.
              <br/><br/>
              To upload a new dataset live, run:
              <br/><code style={{ fontSize: 10, color: 'var(--text-2)' }}>python backend/main.py</code>
            </div>
          )}

          {/* Drop zone (only in live mode) */}
          {backendUp && (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              style={{
                border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 8, padding: '24px 16px', textAlign: 'center',
                cursor: 'pointer', transition: 'border-color .15s',
                background: dragging ? 'oklch(0.55 0.19 265 / .06)' : 'transparent',
              }}>
              {uploading
                ? <span style={{ color: 'var(--text-2)', fontSize: 12 }}>⏳ Processing…</span>
                : <>
                    <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                      Drop <code style={{ fontSize: 10 }}>.csv</code> or <code style={{ fontSize: 10 }}>.xlsx</code> here
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>or click to browse</div>
                  </>}
            </div>
          )}
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }} onChange={onFileInput} />

          {msg && (
            <div style={{
              marginTop: 10, fontSize: 11, borderRadius: 6, padding: '6px 10px',
              background: msg.type === 'ok' ? 'oklch(0.62 0.15 155 / .12)' : 'oklch(0.60 0.20 25 / .12)',
              color: msg.type === 'ok' ? 'oklch(0.45 0.15 155)' : 'oklch(0.45 0.20 25)',
            }}>
              {msg.text}
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-3)', lineHeight: 1.5 }}>
            Accepts: <code style={{ fontSize: 9 }}>all_groups_final_v2_annotated.csv</code> or any CSV with the same schema.
          </div>
        </div>
      )}
    </>
  );
}
window.UploadPanel = UploadPanel;
