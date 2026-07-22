import React from 'react';
import { Avatar, I } from '../../../home-icons';

interface QuestionnaireModalProps {
  member: any;
  questionnaireData: {
    loading: boolean;
    error: string | null;
    hasForm: boolean | null;
    data: any;
  };
  roleColors: Record<string, string>;
  roleLabels: Record<string, string>;
  onClose: () => void;
  onRetry: (memberId: string) => void;
}

export function QuestionnaireModal({
  member,
  questionnaireData,
  roleColors,
  roleLabels,
  onClose,
  onRetry
}: QuestionnaireModalProps) {
  const getHighestRole = (roles: string[] = []) => {
    if (roles.includes('group_owner')) return 'group_owner';
    if (roles.includes('group_admin')) return 'group_admin';
    if (roles.includes('group_moderator')) return 'group_moderator';
    return 'group_member';
  };

  const highestRole = getHighestRole(member.roles);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }} onClick={onClose}>
      <div style={{ background: 'var(--bg)', width: '90%', maxWidth: 500, borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={member.users?.display_name || "Unknown"} userId={member.users?.id} img={member.users?.profilePhoto} size={48} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{member.users?.display_name || "Unknown"}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>@{member.users?.username || "unknown"}</span>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 12 }}>
                <span style={{ color: roleColors[highestRole] || 'var(--ink-2)' }}>Role: {roleLabels[highestRole]}</span>
                <span style={{ color: 'var(--ink-3)' }}>|</span>
                <span style={{ color: member.state === 'active' ? 'var(--accent)' : 'var(--accent-2)' }}>Status: {member.state === 'active' ? 'Approved' : 'Pending'}</span>
              </div>
              {questionnaireData.data?.submittedAt && (
                <span style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                  Joined on: {new Date(questionnaireData.data.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
          <button className="tool" onClick={onClose}>
            <I.x style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px 0', color: 'var(--ink)' }}>Join Questionnaire Responses</h3>

          {questionnaireData.loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <div className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
            </div>
          )}

          {!questionnaireData.loading && questionnaireData.error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32, gap: 12 }}>
              <span style={{ color: '#ef4444', fontSize: 14 }}>{questionnaireData.error}</span>
              <button className="hbtn hbtn--primary hbtn--sm" onClick={() => onRetry(member.user_id)}>Retry</button>
            </div>
          )}

          {!questionnaireData.loading && !questionnaireData.error && questionnaireData.hasForm === false && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--ink-3)', fontSize: 14 }}>
              This group has no join questionnaire.
            </div>
          )}

          {!questionnaireData.loading && !questionnaireData.error && questionnaireData.data?.questions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {questionnaireData.data.questions.map((q: any, idx: number) => (
                <div key={q.fieldId} style={{ display: 'flex', flexDirection: 'column', borderBottom: idx < questionnaireData.data.questions.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: idx < questionnaireData.data.questions.length - 1 ? 16 : 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-2)' }}>Q{q.number}. {q.label} {q.required && <span style={{ color: '#ef4444' }}>*</span>}</span>
                  <div style={{ marginTop: 6, fontSize: 14, color: 'var(--ink)' }}>
                    {!q.answered ? (
                      <span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>(No response submitted)</span>
                    ) : (q.type === 'multiple_choice' || q.type === 'multiselect') ? (
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {q.answer.map((a: any, i: number) => <li key={i}>{a}</li>)}
                      </ul>
                    ) : q.type === 'checkbox' ? (
                      <span>{q.answer ? 'Yes' : 'No'}</span>
                    ) : (
                      <span style={{ whiteSpace: 'pre-wrap' }}>{String(q.answer)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
