import React, { useState, useEffect } from 'react';
import { ME } from '../home-data';
import { I, Grain } from '../home-icons';
import { HtmlRenderer } from '../components/HtmlRenderer';
import { Empty } from '../home-shell';

interface MyGroupsProps {
  go: (dest: string, arg?: any) => void;
  param?: any;
  st?: any;
}

export function MyGroups({ go, param, st }: MyGroupsProps) {
  const [tab, setTab] = useState((param && param.tab) || "joined");
  const [createdSubTab, setCreatedSubTab] = useState((param && param.createdSub) || "active");
  const [ownedGroups, setOwnedGroups] = useState<any[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<any[]>([]);
  const [pendingGroups, setPendingGroups] = useState<any[]>([]);
  const [draftGroups, setDraftGroups] = useState<any[]>([]);
  const [archivedGroups, setArchivedGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mgApiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const mgResolveImg = (url: string) => url && !url.startsWith('blob:') ? (url.startsWith('/api/') ? mgApiBase + url : url) : null;

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        const res = await fetch(`${mgApiBase}/api/groups/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setOwnedGroups(data.data.ownedGroups || []);
          setJoinedGroups(data.data.joinedGroups || []);
          setPendingGroups(data.data.pendingGroups || []);
          setDraftGroups(data.data.draftGroups || []);
          setArchivedGroups(data.data.archivedGroups || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMyGroups();
  }, []);

  const createdList = createdSubTab === "drafts" ? draftGroups : createdSubTab === "archive" ? archivedGroups : ownedGroups;
  const list = tab === "joined" ? joinedGroups : tab === "pending" ? pendingGroups : createdList;

  const renderGroupCard = (g: any) => {
    const bannerSrc = mgResolveImg(g.banner);
    const iconSrc = mgResolveImg(g.icon);
    const isCustomIcon = !!(iconSrc && (iconSrc.startsWith("http") || iconSrc.startsWith("data:") || iconSrc.includes("/")));
    return (
      <div key={g.id} className="fcard" style={{ overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }} onClick={() => {
        if (g.settings?.isDraft) {
          go("create-group", g);
        } else {
          go("group", g);
        }
      }}>
        <div style={{ height: 80, backgroundImage: bannerSrc ? `url("${bannerSrc}")` : undefined, backgroundColor: g.cover, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
          <Grain />
          <div style={{ position: "absolute", left: 16, bottom: -20, width: 48, height: 48, borderRadius: 12, background: g.cover, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "var(--sh-sm)", border: "2px solid var(--surface)", overflow: "hidden" }}>
            {isCustomIcon ? <img src={iconSrc} alt="icon" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : g.icon}
          </div>
        </div>
        <div style={{ padding: "30px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{g.name}</h3>
            {g.settings?.isDraft && <span className="type-pill" style={{ padding: "2px 6px", fontSize: 10 }}>Draft</span>}
            {g.settings?.isArchived && <span className="type-pill" style={{ padding: "2px 6px", fontSize: 10, background: "var(--surface-2)", color: "var(--ink-3)" }}>Archived</span>}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "8px 0 16px", flex: 1, lineBreak: "anywhere", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{g.description || g.desc ? <HtmlRenderer content={g.description || g.desc} /> : null}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--ink-3)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            <span>{g.members?.toLocaleString() || 1} members</span>
            {tab === "created" ? (
              <span style={{ color: "var(--accent-2)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                Manage <I.arrowR style={{ width: 12, height: 12 }} />
              </span>
            ) : (
              <span style={{ color: "var(--ink-3)" }}>{tab === "pending" ? "Pending" : "Joined"}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="scroll">
      <div className="page view-enter">
        <div className="sec-bar" style={{ marginBottom: 18 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            My Groups
            <span style={{ fontSize: 18, color: "var(--ink-3)", fontWeight: 500 }}>{!loading && (joinedGroups.length + ownedGroups.length + pendingGroups.length)}</span>
          </h2>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <div className="seg-tabs">
              <button className={tab === "joined" ? "on" : ""} onClick={() => setTab("joined")}>Joined · {joinedGroups.length}</button>
              <button className={tab === "created" ? "on" : ""} onClick={() => setTab("created")}>Created · {ownedGroups.length + draftGroups.length + archivedGroups.length}</button>
              {pendingGroups.length > 0 && <button className={tab === "pending" ? "on" : ""} onClick={() => setTab("pending")}>Pending · {pendingGroups.length}</button>}
            </div>
            <button className="hbtn hbtn--primary hbtn--sm" onClick={() => go("create-group")}>
              <I.plus style={{ width: 14, height: 14 }} /> Create Group
            </button>
          </div>
        </div>

        {tab === "created" && (
          <div className="seg-tabs" style={{ marginBottom: 16, maxWidth: 380 }}>
            <button className={createdSubTab === "active" ? "on" : ""} onClick={() => setCreatedSubTab("active")}>Active · {ownedGroups.length}</button>
            <button className={createdSubTab === "drafts" ? "on" : ""} onClick={() => setCreatedSubTab("drafts")}>Drafts · {draftGroups.length}</button>
            <button className={createdSubTab === "archive" ? "on" : ""} onClick={() => setCreatedSubTab("archive")}>Archive · {archivedGroups.length}</button>
          </div>
        )}

        {list.length === 0 ? (
          <Empty icon={<I.groups />} title="No groups found" text={tab === "created" && createdSubTab === "drafts" ? "Save a group as draft while creating to see it here." : tab === "created" && createdSubTab === "archive" ? "Archived groups will appear here." : "Join or create a community to see them here."} action={<button className="hbtn hbtn--primary" onClick={() => go("discover")}>Explore groups</button>} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {list.map(g => renderGroupCard(g))}
          </div>
        )}
      </div>
    </div>
  );
}
