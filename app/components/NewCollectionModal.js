'use client';
import { useState } from 'react';

export default function NewCollectionModal({ visible, onClose, onCreate }) {
  const [step, setStep] = useState('type'); // 'type' or 'details'
  const [colType, setColType] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!visible) return null;

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), colType, description.trim());
    setStep('type');
    setColType(null);
    setName('');
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    setStep('type');
    setColType(null);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="modal-overlay open" onClick={handleClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        {step === 'type' && (
          <>
            <h2>New collection</h2>
            <p className="subtitle">Choose a collection type</p>
            <div className="ncm-type-grid">
              <button className="ncm-type-card" onClick={() => { setColType('simple'); setStep('details'); }}>
                <div className="ncm-type-icon" style={{ background: 'var(--accent-soft)' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="var(--accent)" strokeWidth="1.5" /><path d="M7 10h6M10 7v6" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </div>
                <div className="ncm-type-name">Simple Collection</div>
                <div className="ncm-type-desc">A basic list of saved videos. Add videos and watch them whenever you like.</div>
              </button>
              <button className="ncm-type-card" onClick={() => { setColType('curated'); setStep('details'); }}>
                <div className="ncm-type-icon" style={{ background: 'var(--ocean-soft)' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M5 10h10M7 15h6" stroke="var(--ocean)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </div>
                <div className="ncm-type-name">Curated Collection</div>
                <div className="ncm-type-desc">An ordered playlist with context notes per video. Watch in sequence, track progress.</div>
              </button>
            </div>
          </>
        )}

        {step === 'details' && (
          <>
            <h2>{colType === 'curated' ? 'New curated collection' : 'New collection'}</h2>
            <p className="subtitle">{colType === 'curated' ? 'Give it a name and describe what this collection covers.' : 'Give your collection a name.'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="ncm-input"
                type="text"
                placeholder="Collection name"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              {colType === 'curated' && (
                <textarea
                  className="ncm-textarea"
                  placeholder="Description (optional) — explain what this collection covers and why videos are in this order..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setStep('type')}>Back</button>
              <button className="btn-save" onClick={handleCreate} disabled={!name.trim()}>Create</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
