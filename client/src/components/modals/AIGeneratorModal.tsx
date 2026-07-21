import React, { useState } from 'react';
import { I } from '../../home-icons';

interface AIGeneratorModalProps {
    type: 'event' | 'group';
    onClose: () => void;
    onGenerate: (data: any) => void;
}

export function AIGeneratorModal({ type, onClose, onGenerate }: AIGeneratorModalProps) {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError('');

        try {
            const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
            const tkn = localStorage.getItem('token');
            const res = await fetch(`${apiBase}/api/ai/generate-entity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(tkn ? { 'Authorization': `Bearer ${tkn}` } : {})
                },
                body: JSON.stringify({ 
                    prompt, 
                    type,
                    currentDate: new Date().toString() 
                })
            });
            const json = await res.json();
            if (!json.success) {
                throw new Error(json.message || 'Generation failed');
            }
            onGenerate(json.data);
            onClose();
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18 }}>
                        <span style={{ color: '#0d6efd' }}>✨</span> AI {type === 'event' ? 'Event' : 'Group'} Generator
                    </h3>
                    <button className="icon-btn" onClick={onClose}>
                        <I.x />
                    </button>
                </div>
                
                <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
                    Describe the kind of {type} you want to create in a few words, and our AI will generate a catchy name, a professional description, and relevant tags for you!
                </p>

                <div className="form-group" style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Describe your {type}</label>
                    <textarea 
                        className="form-control" 
                        placeholder={`E.g., A casual weekend hiking ${type === 'event' ? 'trip' : 'club'} for beginners in the city...`}
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        style={{ height: 100, padding: 12, borderRadius: 8, border: '1px solid #ddd', width: '100%', boxSizing: 'border-box' }}
                    />
                </div>

                {error && (
                    <div style={{ padding: 12, background: '#fff1f0', color: '#ff4d4f', borderRadius: 8, fontSize: 13, marginBottom: 24 }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button className="hbtn hbtn--ghost" onClick={onClose} disabled={loading}>Cancel</button>
                    <button 
                        className="hbtn hbtn--primary" 
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        {loading ? 'Generating...' : 'Generate Magic'} {loading ? null : '✨'}
                    </button>
                </div>
            </div>
        </div>
    );
}
