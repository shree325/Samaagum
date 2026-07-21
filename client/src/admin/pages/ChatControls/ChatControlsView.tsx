// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../admin-app';
import { Toggle } from '../../../create-event';
import { Messages } from '../../../home-messages';
import { Footer } from '../../../landing-activity';



export const ToggleSwitch = ({ active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: '42px', height: '24px',
      background: active ? '#10b981' : 'var(--border)',
      borderRadius: '24px', position: 'relative', cursor: 'pointer',
      transition: 'all 0.3s ease', border: 'none', padding: 0, outline: 'none',
      boxShadow: active ? '0 0 8px rgba(16, 185, 129, 0.2)' : 'none',
      flexShrink: 0
    }}
  >
    <div style={{
      width: '18px', height: '18px', 
      background: active ? '#ffffff' : 'var(--field)', 
      borderRadius: '50%',
      position: 'absolute', top: '3px', left: active ? '21px' : '3px',
      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
    }} />
  </button>
);

export function ChatControlsView({ user, logAction, addToast }) {
  const [systemRoles, setSystemRoles] = useState([]);
  const [chatSettings, setChatSettings] = useState({
    allowSiteMessaging: true,
    allowDirectMessaging: true,
    allowGroupChat: true,
    allowEventChat: true,
    rolePermissions: {
      directMessaging: [],
      groupChat: [],
      eventChat: [],
      moderate: [],
      pinMessages: [],
      banUsers: []
    },
    communicationPolicies: {
      allowLinks: true,
      allowMedia: true,
      maxMessageLength: 2000,
      directMessagesEnabled: true,
      dmWhoCanSend: 'everyone',
      dmRequestApproval: false,
      dmAllowMedia: true,
      groupChatsEnabled: true,
      groupWhoCanCreate: 'all_members',
      groupModerationMode: 'free_chat',
      groupAllowMedia: true,
      eventChatsEnabled: true,
      eventDefaultModerationMode: 'free_chat',
      eventAutoArchive: true,
      eventOrganizerOverride: true,
      profanityFilter: 'block_message',
      reportReviewQueue: true,
      linkPreviews: true,
      maxMessagesPerMin: 10,
      maxDmsPerDay: 100,
      maxGroupParticipants: 250
    }
  });

  const [chatLoading, setChatLoading] = useState(true);
  const [chatSaving, setChatSaving] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [showEdgeModal, setShowEdgeModal] = useState(false);
  const [rolesExpanded, setRolesExpanded] = useState(false);

  const permissionKeys = [
    { key: 'directMessaging', label: 'DM' },
    { key: 'groupChat', label: 'Group chat' },
    { key: 'eventChat', label: 'Event chat' },
    { key: 'moderate', label: 'Moderate' },
    { key: 'pinMessages', label: 'Pin messages' },
    { key: 'banUsers', label: 'Ban users' }
  ];

  const dropdownStyle = {
    width: '180px',
    height: '38px',
    padding: '0 var(--s-6) 0 var(--s-4)',
    borderRadius: '9999px',
    fontSize: '13px',
    lineHeight: '38px',
    border: '1px solid var(--border)',
    background: 'var(--field)',
    color: 'var(--ink)',
    outline: 'none',
    boxSizing: 'border-box'
  };

  useEffect(() => {
    loadChatSettings();
    loadSystemRoles();
  }, []);

  const loadChatSettings = async () => {
    try {
      setChatLoading(true);
      const res = await apiClient.settings.getChatSettings();
      if (res.success) {
        const data = res.data;
        if (!data.rolePermissions) data.rolePermissions = {};
        if (!data.rolePermissions.moderate) data.rolePermissions.moderate = [];
        if (!data.rolePermissions.pinMessages) data.rolePermissions.pinMessages = [];
        if (!data.rolePermissions.banUsers) data.rolePermissions.banUsers = [];
        if (!data.communicationPolicies) data.communicationPolicies = {};

        const mergedPolicies = {
          allowLinks: true,
          allowMedia: true,
          maxMessageLength: 2000,
          directMessagesEnabled: true,
          dmWhoCanSend: 'everyone',
          dmRequestApproval: false,
          dmAllowMedia: true,
          groupChatsEnabled: true,
          groupWhoCanCreate: 'all_members',
          groupModerationMode: 'free_chat',
          groupAllowMedia: true,
          eventChatsEnabled: true,
          eventDefaultModerationMode: 'free_chat',
          eventAutoArchive: true,
          eventOrganizerOverride: true,
          profanityFilter: 'block_message',
          reportReviewQueue: true,
          linkPreviews: true,
          maxMessagesPerMin: 10,
          maxDmsPerDay: 100,
          maxGroupParticipants: 250,
          ...data.communicationPolicies
        };

        setChatSettings({
          ...data,
          allowSiteMessaging: data.allowSiteMessaging !== false,
          rolePermissions: {
            directMessaging: data.rolePermissions.directMessaging || [],
            groupChat: data.rolePermissions.groupChat || [],
            eventChat: data.rolePermissions.eventChat || [],
            moderate: data.rolePermissions.moderate || [],
            pinMessages: data.rolePermissions.pinMessages || [],
            banUsers: data.rolePermissions.banUsers || []
          },
          communicationPolicies: mergedPolicies
        });
      }
    } catch (err) {
      setChatError(err.message || 'Failed to load chat settings');
    } finally {
      setChatLoading(false);
    }
  };

  const loadSystemRoles = async () => {
    try {
      const res = await apiClient.rbac.getRoles();
      if (res.success) {
        setSystemRoles(res.data.roles || res.data || []);
      }
    } catch (err) {
      console.error('Failed to load system roles for chat settings', err);
    }
  };

  const isPermissionActive = (roleKey, permType) => {
    const list = chatSettings.rolePermissions[permType] || [];
    return list.includes(roleKey);
  };

  const togglePermission = (roleKey, permType) => {
    const list = chatSettings.rolePermissions[permType] || [];
    const isActive = list.includes(roleKey);

    let updatedList;
    if (isActive) {
      updatedList = list.filter(key => key !== roleKey);
    } else {
      updatedList = [...list, roleKey];
    }

    setChatSettings(prev => ({
      ...prev,
      rolePermissions: {
        ...prev.rolePermissions,
        [permType]: updatedList
      }
    }));
  };

  const updatePolicyField = (field, value) => {
    setChatSettings(prev => ({
      ...prev,
      communicationPolicies: {
        ...prev.communicationPolicies,
        [field]: value
      }
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setChatSaving(true);
      setChatError(null);
      const res = await apiClient.settings.saveChatSettings(chatSettings);
      if (res.success) {
        addToast(res.message || 'Chat configuration saved successfully', 'success');
        logAction(user?.email || 'Admin', 'Updated Chat Governance configuration.');
        await loadChatSettings();
      }
    } catch (err) {
      setChatError(err.message || 'Failed to save chat settings');
    } finally {
      setChatSaving(false);
    }
  };

  const toggleMaster = (feature) => {
    const isEnabled = chatSettings.communicationPolicies[feature];
    updatePolicyField(feature, !isEnabled);
  };

  if (chatLoading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--ink-3)' }}>
        <div style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
        <p style={{ fontSize: '14px' }}>Loading Chat Governance configurations...</p>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, margin: 0, color: 'var(--ink)' }}>Chat Controls & Governance</h2>
        <p style={{ fontSize: '13px', color: 'var(--ink-3)', margin: '6px 0 0 0' }}>Manage platform-wide communication rules, role capabilities, and spam restrictions.</p>
      </div>

      {chatError && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgb(239, 68, 68)', color: '#ef4444', borderRadius: '8px', fontSize: '14px' }}>
          {chatError}
        </div>
      )}

      {/* Global Messaging Toggle */}
      <div className="stat-card" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>Global Messaging Status</span>
            <span style={{ display: 'block', fontSize: '12.5px', color: 'var(--ink-3)', marginTop: '4px', lineHeight: '1.4' }}>
              Master switch to enable or disable all messaging features site-wide. Disabling this hides message icons everywhere.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 500, 
              padding: '3px 10px', 
              borderRadius: '12px', 
              background: chatSettings.allowSiteMessaging ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: chatSettings.allowSiteMessaging ? '#10b981' : '#ef4444',
              border: chatSettings.allowSiteMessaging ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)'
            }}>
              {chatSettings.allowSiteMessaging ? 'Active' : 'Disabled'}
            </span>
            <ToggleSwitch
              active={chatSettings.allowSiteMessaging}
              onClick={() => setChatSettings({ ...chatSettings, allowSiteMessaging: !chatSettings.allowSiteMessaging })}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', opacity: chatSettings.allowSiteMessaging ? 1 : 0.45, pointerEvents: chatSettings.allowSiteMessaging ? 'auto' : 'none', transition: 'all 0.2s ease-in-out' }}>
        {/* 1. Direct Messages */}
        <div className="stat-card" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="checkbox" 
              checked={chatSettings.communicationPolicies.directMessagesEnabled}
              onChange={() => toggleMaster('directMessagesEnabled')}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>Direct messages</span>
          </div>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 500, 
            padding: '3px 10px', 
            borderRadius: '12px', 
            background: chatSettings.communicationPolicies.directMessagesEnabled ? 'rgba(16,185,129,0.12)' : 'var(--surface-2)',
            color: chatSettings.communicationPolicies.directMessagesEnabled ? '#10b981' : 'var(--ink-3)',
            border: chatSettings.communicationPolicies.directMessagesEnabled ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border)'
          }}>
            {chatSettings.communicationPolicies.directMessagesEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', opacity: chatSettings.communicationPolicies.directMessagesEnabled ? 1 : 0.45, pointerEvents: chatSettings.communicationPolicies.directMessagesEnabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
          
          {/* Toggle 1: Enable Direct Messages */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>Enable direct messages</span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px', lineHeight: '1.4' }}>Allow users to privately message each other on the platform</span>
            </div>
            <ToggleSwitch
              active={chatSettings.allowDirectMessaging}
              onClick={() => setChatSettings({ ...chatSettings, allowDirectMessaging: !chatSettings.allowDirectMessaging })}
            />
          </div>

          {/* Selector: Who can send DMs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>Who can send DMs</span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px', lineHeight: '1.4' }}>Controls which users can initiate direct conversations</span>
            </div>
            <select 
              value={chatSettings.communicationPolicies.dmWhoCanSend} 
              onChange={(e) => updatePolicyField('dmWhoCanSend', e.target.value)}
              style={dropdownStyle}
            >
              <option value="everyone">Everyone</option>
              <option value="members_only">Members Only</option>
              <option value="admins_only">Admins Only</option>
            </select>
          </div>

          {/* Toggle 2: DM request approval */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>DM request approval</span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px', lineHeight: '1.4' }}>Recipient must accept before a conversation can begin</span>
            </div>
            <ToggleSwitch
              active={chatSettings.communicationPolicies.dmRequestApproval}
              onClick={() => updatePolicyField('dmRequestApproval', !chatSettings.communicationPolicies.dmRequestApproval)}
            />
          </div>

          {/* Toggle 3: Allow media in DMs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>Allow media in DMs</span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px', lineHeight: '1.4' }}>Users can share images, files, and links in private messages</span>
            </div>
            <ToggleSwitch
              active={chatSettings.communicationPolicies.dmAllowMedia}
              onClick={() => updatePolicyField('dmAllowMedia', !chatSettings.communicationPolicies.dmAllowMedia)}
            />
          </div>
        </div>
      </div>

      {/* 2. Group Chats */}
      <div className="stat-card" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="checkbox" 
              checked={chatSettings.communicationPolicies.groupChatsEnabled}
              onChange={() => toggleMaster('groupChatsEnabled')}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>Group chats</span>
          </div>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 500, 
            padding: '3px 10px', 
            borderRadius: '12px', 
            background: chatSettings.communicationPolicies.groupChatsEnabled ? 'rgba(16,185,129,0.12)' : 'var(--surface-2)',
            color: chatSettings.communicationPolicies.groupChatsEnabled ? '#10b981' : 'var(--ink-3)',
            border: chatSettings.communicationPolicies.groupChatsEnabled ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border)'
          }}>
            {chatSettings.communicationPolicies.groupChatsEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', opacity: chatSettings.communicationPolicies.groupChatsEnabled ? 1 : 0.45, pointerEvents: chatSettings.communicationPolicies.groupChatsEnabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
          {/* Toggle 1: Enable group chats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>Enable group chats</span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px', lineHeight: '1.4' }}>Allow members to discuss within their groups</span>
            </div>
            <ToggleSwitch
              active={chatSettings.allowGroupChat}
              onClick={() => setChatSettings({ ...chatSettings, allowGroupChat: !chatSettings.allowGroupChat })}
            />
          </div>

          {/* Toggle 2: Allow media in group chats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>Allow media in group chats</span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px', lineHeight: '1.4' }}>Members can post images, files, and links</span>
            </div>
            <ToggleSwitch
              active={chatSettings.communicationPolicies.groupAllowMedia}
              onClick={() => updatePolicyField('groupAllowMedia', !chatSettings.communicationPolicies.groupAllowMedia)}
            />
          </div>
        </div>
      </div>

      {/* 3. Event Chats */}
      <div className="stat-card" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="checkbox" 
              checked={chatSettings.communicationPolicies.eventChatsEnabled}
              onChange={() => toggleMaster('eventChatsEnabled')}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>Event chats</span>
          </div>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 500, 
            padding: '3px 10px', 
            borderRadius: '12px', 
            background: chatSettings.communicationPolicies.eventChatsEnabled ? 'rgba(16,185,129,0.12)' : 'var(--surface-2)',
            color: chatSettings.communicationPolicies.eventChatsEnabled ? '#10b981' : 'var(--ink-3)',
            border: chatSettings.communicationPolicies.eventChatsEnabled ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border)'
          }}>
            {chatSettings.communicationPolicies.eventChatsEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', opacity: chatSettings.communicationPolicies.eventChatsEnabled ? 1 : 0.45, pointerEvents: chatSettings.communicationPolicies.eventChatsEnabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
          {/* Toggle 1: Enable event chats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>Enable event chats</span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px', lineHeight: '1.4' }}>Allow attendees to chat within an event's discussion space</span>
            </div>
            <ToggleSwitch
              active={chatSettings.allowEventChat}
              onClick={() => setChatSettings({ ...chatSettings, allowEventChat: !chatSettings.allowEventChat })}
            />
          </div>

          {/* Toggle 2: Auto-archive after event ends */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>Auto-archive after event ends</span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px', lineHeight: '1.4' }}>Event chat becomes read-only after the event concludes</span>
            </div>
            <ToggleSwitch
              active={chatSettings.communicationPolicies.eventAutoArchive}
              onClick={() => updatePolicyField('eventAutoArchive', !chatSettings.communicationPolicies.eventAutoArchive)}
            />
          </div>
        </div>
      </div>

      {/* 4. Role-based messaging permissions matrix */}
      <div className="stat-card" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'none' }}>
        <div 
          onClick={() => setRolesExpanded(!rolesExpanded)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: rolesExpanded ? '1px solid var(--border)' : 'none', paddingBottom: rolesExpanded ? '12px' : '0', cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>Role-based messaging permissions</span>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 500, 
              padding: '3px 10px', 
              borderRadius: '12px', 
              background: 'rgba(0,122,255,0.1)',
              color: 'var(--primary)',
              border: '1px solid rgba(0,122,255,0.2)'
            }}>
              {systemRoles.length} roles
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-3)' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>{rolesExpanded ? 'Collapse' : 'Expand'}</span>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ transform: rolesExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {rolesExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px' }}>
              CLICK PERMISSIONS TO TOGGLE THEM PER ROLE
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
              {systemRoles.map(role => (
                <div key={role.id} style={{ 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{role.display_name}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {permissionKeys.map(perm => {
                      const active = isPermissionActive(role.name, perm.key);
                      return (
                        <button
                          key={perm.key}
                          onClick={() => togglePermission(role.name, perm.key)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 500,
                            border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                            background: active ? 'var(--primary-light, rgba(0, 122, 255, 0.1))' : 'var(--surface)',
                            color: active ? 'var(--primary)' : 'var(--ink-3)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {perm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <style>{`
              @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
          </div>
        )}
      </div>

      {/* 5. Communication policies */}
      <div className="stat-card" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>Communication policies</span>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 500, 
            padding: '3px 10px', 
            borderRadius: '12px', 
            background: 'rgba(245,158,11,0.12)',
            color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.2)'
          }}>
            Review needed
          </span>
        </div>

        {/* Profanity filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>Profanity filter</span>
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px', lineHeight: '1.4' }}>Automatically filter offensive language across all chats</span>
          </div>
          <select 
            value={chatSettings.communicationPolicies.profanityFilter} 
            onChange={(e) => updatePolicyField('profanityFilter', e.target.value)}
            style={dropdownStyle}
          >
            <option value="block_message">Block message</option>
            <option value="blur_message">Blur message</option>
            <option value="disable">Disable</option>
          </select>
        </div>

        {/* Toggle: Report & review queue */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>Report & review queue</span>
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px', lineHeight: '1.4' }}>Flagged messages are held for admin review before action</span>
          </div>
          <ToggleSwitch
            active={chatSettings.communicationPolicies.reportReviewQueue}
            onClick={() => updatePolicyField('reportReviewQueue', !chatSettings.communicationPolicies.reportReviewQueue)}
          />
        </div>

        {/* Toggle: Link previews */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>Link previews</span>
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px', lineHeight: '1.4' }}>Show rich previews when links are shared in any chat</span>
          </div>
          <ToggleSwitch
            active={chatSettings.communicationPolicies.linkPreviews}
            onClick={() => updatePolicyField('linkPreviews', !chatSettings.communicationPolicies.linkPreviews)}
          />
        </div>

        {/* Rate Limits */}
        <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '16px' }}>
            RATE LIMITS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Input 1: Max messages per user per minute */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>Max messages per user per minute</span>
              <input
                type="number"
                className="form-control"
                value={chatSettings.communicationPolicies.maxMessagesPerMin || 10}
                onChange={(e) => updatePolicyField('maxMessagesPerMin', Number(e.target.value))}
                style={{ width: '120px', height: '36px', textAlign: 'center' }}
              />
            </div>

            {/* Input 2: Max DMs per day per user */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>Max DMs per day per user</span>
              <input
                type="number"
                className="form-control"
                value={chatSettings.communicationPolicies.maxDmsPerDay || 100}
                onChange={(e) => updatePolicyField('maxDmsPerDay', Number(e.target.value))}
                style={{ width: '120px', height: '36px', textAlign: 'center' }}
              />
            </div>

            {/* Input 3: Max participants in a group chat */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>Max participants in a group chat</span>
              <input
                type="number"
                className="form-control"
                value={chatSettings.communicationPolicies.maxGroupParticipants || 250}
                onChange={(e) => updatePolicyField('maxGroupParticipants', Number(e.target.value))}
                style={{ width: '120px', height: '36px', textAlign: 'center' }}
              />
            </div>
          </div>
        </div>

      </div>

      </div>

      {/* Footer Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
        <button
          type="button"
          onClick={() => setShowEdgeModal(true)}
          className="btn-sm btn-sm-ghost"
          style={{ padding: '10px 20px', height: '40px', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 500 }}
        >
          Ask about edge cases &rarr;
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={chatSaving}
          className="btn-sm btn-sm-primary"
          style={{ padding: '10px 24px', height: '40px', background: 'var(--primary)', color: '#fff', fontSize: '13px', fontWeight: 500 }}
        >
          {chatSaving ? 'Saving changes...' : 'Save changes'}
        </button>
      </div>

      {/* Edge Cases Modal */}
      {showEdgeModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: '600px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>Edge Cases & Governance Policies</h3>
              <button 
                onClick={() => setShowEdgeModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: '20px' }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Rate Limiting Thresholds</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  Spam threshold limits restrict clients when they exceed the configured rate (e.g. 10 messages/min). Exceeding this triggers a temporary lock.
                </p>
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Profanity Handling</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  - <strong>Block message:</strong> The message is rejected at the API/Socket layer and not saved. An alert is returned to the user.<br/>
                  - <strong>Blur message:</strong> The message is saved but sensitive words are replaced with asterisks/obscured.
                </p>
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Report Queue Moderation</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  When reports are triggered, messages can be optionally held in the moderation queue until explicitly approved or dismissed by an admin.
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--surface-2)' }}>
              <button 
                onClick={() => setShowEdgeModal(false)}
                className="btn-sm btn-sm-primary"
                style={{ padding: '8px 16px', height: '36px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


