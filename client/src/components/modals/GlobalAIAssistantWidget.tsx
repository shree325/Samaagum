import React, { useState, useEffect, useRef } from 'react';
import { I } from '../../home-icons';
import { useNavigate } from 'react-router-dom';

export function GlobalAIAssistantWidget({ aiEnabled }: { aiEnabled?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Initial greeting message
    const [messages, setMessages] = useState([
        { role: 'ai', content: "Hi! I'm your AI assistant. Ask me anything about Samaagum, or tell me to create an event or group for you!" }
    ]);
    
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!prompt.trim() || loading) return;
        
        const userMessage = prompt.trim();
        setPrompt('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
            const tkn = localStorage.getItem('token');
            const res = await fetch(`${apiBase}/api/ai/global-assistant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(tkn ? { 'Authorization': `Bearer ${tkn}` } : {})
                },
                body: JSON.stringify({ 
                    prompt: userMessage, 
                    currentDate: new Date().toString() 
                })
            });
            const json = await res.json();
            if (!json.success) {
                throw new Error(json.message || 'Generation failed');
            }
            
            const intent = json.data.intent;
            if (intent === 'general_question') {
                setMessages(prev => [...prev, { role: 'ai', content: json.data.answer }]);
            } else if (intent === 'create_event') {
                setMessages(prev => [...prev, { role: 'ai', content: "Generating your event and redirecting..." }]);
                
                const draft = json.data.data || {};
                if (draft.imagePrompt) {
                    draft.cover = `https://image.pollinations.ai/prompt/${encodeURIComponent(draft.imagePrompt)}?width=1080&height=1080&nologo=true`;
                }
                
                localStorage.setItem('sg_draft_event', JSON.stringify({
                    title: draft.title,
                    desc: draft.description,
                    cat: draft.category,
                    startDate: draft.startDate,
                    startTime: draft.startTime,
                    endDate: draft.endDate,
                    endTime: draft.endTime,
                    visibility: draft.visibility,
                    registrationStatus: draft.registrationStatus,
                    approval: draft.requireApproval,
                    questionnaire: draft.questionnaireEnabled,
                    capacityEnabled: !!draft.capacity,
                    capacity: draft.capacity ? String(draft.capacity) : undefined,
                    cover: draft.cover
                }));
                
                setTimeout(() => {
                    setIsOpen(false);
                    navigate('/create-event');
                }, 1500);
            } else if (intent === 'create_group') {
                setMessages(prev => [...prev, { role: 'ai', content: "Generating your group and redirecting..." }]);
                
                const draft = json.data.data || {};
                if (draft.imagePrompt) {
                    draft.banner = `https://image.pollinations.ai/prompt/${encodeURIComponent(draft.imagePrompt)}?width=1080&height=1080&nologo=true`;
                }

                localStorage.setItem('sg_draft_group', JSON.stringify({
                    name: draft.name,
                    desc: draft.description,
                    cat: draft.category,
                    visibility: draft.visibility,
                    joinElig: draft.joinElig,
                    approval: draft.approval,
                    capacityEnabled: !!draft.capacity,
                    capacity: draft.capacity ? String(draft.capacity) : undefined,
                    banner: draft.banner
                }));
                
                setTimeout(() => {
                    setIsOpen(false);
                    navigate('/create-group');
                }, 1500);
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: "I couldn't quite understand what you want to do. Please try asking a question or asking to create an event/group." }]);
            }
        } catch (err: any) {
            setMessages(prev => [...prev, { role: 'ai', content: `Oops, something went wrong: ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    if (!aiEnabled) return null;

    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {isOpen && (
                <div style={{
                    width: 360,
                    height: 500,
                    maxHeight: '75vh',
                    background: 'var(--surface)',
                    borderRadius: 16,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    border: '1px solid var(--border)',
                    marginBottom: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{
                        padding: '16px',
                        background: 'linear-gradient(135deg, #0d6efd, #0dcaf0)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 24 }}>🤖</span>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 16 }}>Samaagum AI</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}
                        >
                            <I.x />
                        </button>
                    </div>
                    
                    <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-2)' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                background: msg.role === 'user' ? '#0d6efd' : 'var(--surface)',
                                color: msg.role === 'user' ? '#fff' : 'var(--ink)',
                                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                                padding: '10px 14px',
                                borderRadius: msg.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                fontSize: 13.5,
                                lineHeight: 1.5,
                                whiteSpace: 'pre-wrap',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}>
                                {msg.content}
                            </div>
                        ))}
                        {loading && (
                            <div style={{
                                alignSelf: 'flex-start',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                padding: '10px 14px',
                                borderRadius: '16px 16px 16px 2px',
                                fontSize: 13.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                            }}>
                                <span className="typing-dot" style={{ animationDelay: '0s' }}>.</span>
                                <span className="typing-dot" style={{ animationDelay: '0.2s' }}>.</span>
                                <span className="typing-dot" style={{ animationDelay: '0.4s' }}>.</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: 12, background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                        <input
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                            placeholder="Type a message..."
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                borderRadius: 20,
                                border: '1px solid var(--border)',
                                background: 'var(--field)',
                                color: 'var(--ink)',
                                outline: 'none',
                                fontSize: 13.5
                            }}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!prompt.trim() || loading}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: prompt.trim() && !loading ? '#0d6efd' : 'var(--border)',
                                color: 'white',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: prompt.trim() && !loading ? 'pointer' : 'default',
                                transition: '0.2s'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    style={{ 
                        width: 56, 
                        height: 56, 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #0d6efd, #0dcaf0)',
                        boxShadow: '0 4px 16px rgba(13, 110, 253, 0.4)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 32,
                        animation: 'bounce-robot-fab 2s infinite ease-in-out',
                        transition: 'transform 0.2s'
                    }}
                >
                    🤖
                </button>
            )}

            <style>{`
                @keyframes bounce-robot-fab {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); transform-origin: bottom right; }
                    to { opacity: 1; transform: translateY(0) scale(1); transform-origin: bottom right; }
                }
                .typing-dot {
                    animation: typing-bounce 1s infinite;
                    font-size: 20px;
                    line-height: 10px;
                }
                @keyframes typing-bounce {
                    0%, 100% { opacity: 0.3; transform: translateY(0); }
                    50% { opacity: 1; transform: translateY(-2px); }
                }
            `}</style>
        </div>
    );
}
