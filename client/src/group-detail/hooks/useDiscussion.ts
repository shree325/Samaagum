import { useState, useCallback, useEffect, useRef } from 'react';
import { Group, Post, Comment } from '../types';

export function useDiscussion(g: Group, permissions: any) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [activeThread, setActiveThread] = useState<Post | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadBody, setNewThreadBody] = useState("");
  const [newThreadTag, setNewThreadTag] = useState("");
  const [postingThread, setPostingThread] = useState(false);

  const [sort, setSort] = useState("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [threadVotes, setThreadVotes] = useState<Record<string, { score: number; userVote: number }>>({});
  const [threadReactions, setThreadReactions] = useState<Record<string, Record<string, number>>>({});
  const [commentVotes, setCommentVotes] = useState<Record<string, { score: number; userVote: number }>>({});

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [inlineReplyDraft, setInlineReplyDraft] = useState("");
  const [submittingInlineReply, setSubmittingInlineReply] = useState(false);
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());

  // Edit states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostDraft, setEditPostDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");

  const token = localStorage.getItem('token');

  const fetchPosts = useCallback(async (sortArg?: string) => {
    if (!g.id || g.id === "newg") return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const params = new URLSearchParams({ page: "1", limit: "50", sort: sortArg || sort });
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts?${params}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
        const votes: Record<string, { score: number; userVote: number }> = {};
        const reactions: Record<string, Record<string, number>> = {};
        data.data.forEach((p: Post) => {
          votes[p.id] = { score: p.vote_score || 0, userVote: p.user_vote || 0 };
          reactions[p.id] = p.reactions || {};
        });
        setThreadVotes(votes);
        setThreadReactions(reactions);
      }
    } catch (e) { console.error(e); }
  }, [g.id, sort, token]);

  const handlePost = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ body: draft })
      });
      const data = await res.json();
      if (data.success) {
        setDraft("");
        fetchPosts();
      } else alert(data.message);
    } catch (e) { console.error(e); }
    setPosting(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this discussion?")) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${postId}`, {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else alert(data.message);
    } catch (e) { console.error(e); }
  };

  const handleApproveThread = async (postId: string) => {
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${postId}/approve`, {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'active' } : p));
      } else alert(data.message);
    } catch (e) { console.error(e); }
  };

  const openThread = async (post: Post) => {
    setActiveThread({ ...post, comments: [] });
    setLoadingThread(true);
    setReplyDraft("");
    setReplyingToId(null);
    setCommentVotes({});
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${post.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setActiveThread(data.data);
        const initCVotes: Record<string, { score: number; userVote: number }> = {};
        const walkComments = (comments: Comment[]) => {
          (comments || []).forEach(c => {
            initCVotes[c.id] = { score: c.vote_score || 0, userVote: c.user_vote || 0 };
            if (c.replies) walkComments(c.replies);
          });
        };
        walkComments(data.data.comments || []);
        setCommentVotes(initCVotes);
        setThreadVotes(prev => ({ ...prev, [data.data.id]: { score: data.data.vote_score || 0, userVote: data.data.user_vote || 0 } }));
        setThreadReactions(prev => ({ ...prev, [data.data.id]: data.data.reactions || {} }));
      }
    } catch (e) { console.error(e); }
    setLoadingThread(false);
  };

  const refreshThreadComments = useCallback(async (threadId: string) => {
    if (!threadId) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${threadId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setActiveThread(data.data);
        const initCVotes: Record<string, { score: number; userVote: number }> = {};
        const walkComments = (comments: Comment[]) => {
          (comments || []).forEach(c => {
            initCVotes[c.id] = { score: c.vote_score || 0, userVote: c.user_vote || 0 };
            if (c.replies) walkComments(c.replies);
          });
        };
        walkComments(data.data.comments || []);
        setCommentVotes(initCVotes);
        setThreadVotes(prev => ({ ...prev, [data.data.id]: { score: data.data.vote_score || 0, userVote: data.data.user_vote || 0 } }));
        setThreadReactions(prev => ({ ...prev, [data.data.id]: data.data.reactions || {} }));
      }
    } catch (e) { console.error(e); }
  }, [g.id, token]);

  const handleNewThread = async () => {
    if (!newThreadTitle.trim() && !newThreadBody.trim()) return;
    setPostingThread(true);
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title: newThreadTitle, body: newThreadBody, tags: newThreadTag ? [newThreadTag] : [] })
      });
      const data = await res.json();
      if (data.success) {
        setNewThreadTitle("");
        setNewThreadBody("");
        setNewThreadTag("");
        setShowNewThreadModal(false);
        fetchPosts(sort);
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
    setPostingThread(false);
  };

  const handleSubmitReply = async () => {
    if (!replyDraft.trim() || !activeThread) return;
    setSubmittingReply(true);
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${activeThread.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ body: replyDraft })
      });
      const data = await res.json();
      if (data.success) {
        setReplyDraft("");
        setActiveThread(prev => prev ? { ...prev, comments: [...(prev.comments || []), data.data] } : null);
        setPosts(prev => prev.map(p => p.id === activeThread.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
    setSubmittingReply(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!activeThread || !confirm("Delete this reply?")) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${activeThread.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const removeComment = (comments: Comment[]): Comment[] => comments.filter(c => c.id !== commentId).map(c => ({ ...c, replies: removeComment(c.replies || []) }));
        setActiveThread(prev => prev ? { ...prev, comments: removeComment(prev.comments || []) } : null);
        setPosts(prev => prev.map(p => p.id === activeThread.id ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) } : p));
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
  };

  const handleVoteThread = async (postId: string, vote: number) => {
    const prev = threadVotes[postId] || { score: 0, userVote: 0 };
    setThreadVotes(v => ({ ...v, [postId]: { score: prev.score + (vote - prev.userVote), userVote: vote } }));
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ vote })
      });
      const data = await res.json();
      if (data.success) setThreadVotes(v => ({ ...v, [postId]: { score: data.data.vote_score, userVote: data.data.user_vote } }));
    } catch (e) { console.error(e); }
  };

  const handleVoteComment = async (commentId: string, vote: number) => {
    const prev = commentVotes[commentId] || { score: 0, userVote: 0 };
    setCommentVotes(v => ({ ...v, [commentId]: { score: prev.score + (vote - prev.userVote), userVote: vote } }));
    if (!activeThread) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${activeThread.id}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ vote })
      });
      const data = await res.json();
      if (data.success) setCommentVotes(v => ({ ...v, [commentId]: { score: data.data.vote_score, userVote: data.data.user_vote } }));
    } catch (e) { console.error(e); }
  };

  const handleReactThread = async (postId: string, emoji: string) => {
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ emoji })
      });
      const data = await res.json();
      if (data.success) {
        setThreadReactions(r => ({ ...r, [postId]: data.data.reactions }));
        if (activeThread && activeThread.id === postId) setActiveThread(prev => prev ? { ...prev, reactions: data.data.reactions } : null);
      }
    } catch (e) { console.error(e); }
  };

  const handleLikeThread = async (postId: string) => {
    const isLiked = myLikes.has(postId);
    setMyLikes(prev => {
      const next = new Set(prev);
      isLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setThreadReactions(r => {
      const prev = r[postId] || {};
      const prevCount = prev['❤️'] || 0;
      return { ...r, [postId]: { ...prev, '❤️': Math.max(0, isLiked ? prevCount - 1 : prevCount + 1) } };
    });
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ emoji: '❤️' })
      });
      const data = await res.json();
      if (data.success) {
        setThreadReactions(r => ({ ...r, [postId]: data.data.reactions }));
      }
    } catch (e) {
      setMyLikes(prev => {
        const next = new Set(prev);
        isLiked ? next.add(postId) : next.delete(postId);
        return next;
      });
    }
  };

  const handleSolveThread = async (postId: string, solved: boolean) => {
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${postId}/solve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ solved })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, solved } : p));
        if (activeThread && activeThread.id === postId) setActiveThread(prev => prev ? { ...prev, solved } : null);
      }
    } catch (e) { console.error(e); }
  };

  const handleStartReply = (commentId: string) => { setReplyingToId(commentId); setInlineReplyDraft(""); };
  const handleCancelReply = () => { setReplyingToId(null); setInlineReplyDraft(""); };

  const handleSubmitInlineReply = async (parentCommentId: string) => {
    if (!inlineReplyDraft.trim() || !activeThread) return;
    setSubmittingInlineReply(true);
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${activeThread.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ body: inlineReplyDraft, parent_id: parentCommentId })
      });
      const data = await res.json();
      if (data.success) {
        setInlineReplyDraft("");
        setReplyingToId(null);
        const insertReply = (comments: Comment[], pid: string, nc: Comment): Comment[] => comments.map(c => c.id === pid ? { ...c, replies: [...(c.replies || []), nc] } : { ...c, replies: insertReply(c.replies || [], pid, nc) });
        setActiveThread(prev => prev ? { ...prev, comments: insertReply(prev.comments || [], parentCommentId, data.data) } : null);
        setPosts(prev => prev.map(p => p.id === activeThread.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
      } else { alert(data.message); }
    } catch (e) { console.error(e); }
    setSubmittingInlineReply(false);
  };

  const handleEditPost = async () => {
    if (!editPostDraft.trim() || !editingPostId) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${editingPostId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ body: editPostDraft, title: activeThread?.title || null })
      });
      const data = await res.json();
      if (data.success) {
        setActiveThread(prev => prev ? { ...prev, body: editPostDraft } : null);
        setPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, body: editPostDraft } : p));
        setEditingPostId(null);
        setEditPostDraft("");
      } else { alert(data.message); }
    } catch (e) { console.error(e); }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editCommentDraft.trim() || !activeThread) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${activeThread.id}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ body: editCommentDraft })
      });
      const data = await res.json();
      if (data.success) {
        const updateComment = (comments: Comment[]): Comment[] => comments.map(c => c.id === commentId ? { ...c, body: editCommentDraft } : { ...c, replies: updateComment(c.replies || []) });
        setActiveThread(prev => prev ? { ...prev, comments: updateComment(prev.comments || []) } : null);
        setEditingCommentId(null);
        setEditCommentDraft("");
      } else { alert(data.message); }
    } catch (e) { console.error(e); }
  };

  return {
    posts,
    setPosts,
    draft,
    setDraft,
    handleApproveThread,
    posting,
    activeThread,
    setActiveThread,
    loadingThread,
    replyDraft,
    setReplyDraft,
    submittingReply,
    showNewThreadModal,
    setShowNewThreadModal,
    newThreadTitle,
    setNewThreadTitle,
    newThreadBody,
    setNewThreadBody,
    newThreadTag,
    setNewThreadTag,
    postingThread,
    sort,
    setSort,
    searchQuery,
    setSearchQuery,
    activeTag,
    setActiveTag,
    threadVotes,
    setThreadVotes,
    threadReactions,
    setThreadReactions,
    commentVotes,
    setCommentVotes,
    replyingToId,
    inlineReplyDraft,
    setInlineReplyDraft,
    submittingInlineReply,
    myLikes,
    editingPostId,
    setEditingPostId,
    editPostDraft,
    setEditPostDraft,
    editingCommentId,
    setEditingCommentId,
    editCommentDraft,
    setEditCommentDraft,
    fetchPosts,
    handlePost,
    handleDeletePost,
    openThread,
    refreshThreadComments,
    handleNewThread,
    handleSubmitReply,
    handleDeleteComment,
    handleVoteThread,
    handleVoteComment,
    handleReactThread,
    handleLikeThread,
    handleSolveThread,
    handleStartReply,
    handleCancelReply,
    handleSubmitInlineReply,
    handleEditPost,
    handleEditComment
  };
}
