import React from 'react';
import { I } from '../../../home-icons';
import { SortBar } from './SortBar';
import { ThreadCard } from './ThreadCard';
import { ThreadModal } from './ThreadModal';
import { NewDiscussionModal } from './NewDiscussionModal';
import { ALL_FORUM_TAGS, TAG_COLORS } from '../../utils/constants';

interface DiscussionTabProps {
  discussion: any;
  permissions: any;
  gId: string;
  isOwner: boolean;
  currentUserId: string | null;
  token: string | null;
  ME: any;
  handleJoinClick: () => void;
  isPending: boolean;
  canEdit: (createdAt: any) => boolean;
}

export function DiscussionTab({
  discussion,
  permissions,
  gId,
  isOwner,
  currentUserId,
  token,
  ME,
  handleJoinClick,
  isPending,
  canEdit
}: DiscussionTabProps) {
  const {
    posts,
    setPosts,
    draft,
    setDraft,
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
    threadReactions,
    commentVotes,
    replyingToId,
    inlineReplyDraft,
    setInlineReplyDraft,
    submittingInlineReply,
    myLikes,
    editingPostId,
    editPostDraft,
    editingCommentId,
    editCommentDraft,
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
  } = discussion;

  const {
    forumsEnabled,
    canPost,
    canReply,
    isMember,
    isPublicGroup
  } = permissions;

  const filteredPosts = (activeTag
    ? posts.filter((p: any) => (p.tags || []).some((t: any) => t.name === activeTag))
    : posts
  ).filter((p: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (p.title || '').toLowerCase().includes(q) || (p.body || '').toLowerCase().includes(q);
  });

  if (activeThread !== null) {
    return (
      <ThreadModal
        activeThread={activeThread}
        loadingThread={loadingThread}
        replyDraft={replyDraft}
        setReplyDraft={setReplyDraft}
        submittingReply={submittingReply}
        canReply={canReply}
        isOwner={isOwner}
        currentUserId={currentUserId}
        replyingToId={replyingToId}
        inlineReplyDraft={inlineReplyDraft}
        submittingInlineReply={submittingInlineReply}
        commentVotes={commentVotes}
        editingPostId={editingPostId}
        editPostDraft={editPostDraft}
        setEditingPostId={discussion.setEditingPostId}
        setEditPostDraft={discussion.setEditPostDraft}
        editingCommentId={editingCommentId}
        editCommentDraft={editCommentDraft}
        setEditingCommentId={discussion.setEditingCommentId}
        setEditCommentDraft={discussion.setEditCommentDraft}
        myLikes={myLikes}
        threadVotes={threadVotes}
        threadReactions={threadReactions}
        gId={gId}
        token={token}
        ME={ME}
        onBack={() => { setActiveThread(null); setReplyDraft(""); discussion.handleCancelReply(); }}
        onVoteThread={handleVoteThread}
        onVoteComment={handleVoteComment}
        onReactThread={handleReactThread}
        onLikeThread={handleLikeThread}
        onSolveThread={handleSolveThread}
        onDeletePost={handleDeletePost}
        onEditPost={handleEditPost}
        onEditComment={handleEditComment}
        onStartReply={handleStartReply}
        onCancelReply={handleCancelReply}
        onSubmitInlineReply={handleSubmitInlineReply}
        onInlineReplyChange={setInlineReplyDraft}
        onDeleteComment={handleDeleteComment}
        onSubmitReply={handleSubmitReply}
        canEdit={canEdit}
        setPosts={setPosts}
        setActiveThread={setActiveThread}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <SortBar sort={sort} onSort={s => setSort(s)} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <I.search style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--ink-3)", pointerEvents: "none" }} />
            <input className="cinput" placeholder="Search threads…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 28, width: 170, fontSize: 13 }} />
          </div>
          {canPost && (
            <button className="hbtn hbtn--primary hbtn--sm" onClick={() => setShowNewThreadModal(true)}>
              <I.plus style={{ width: 14, height: 14 }} /> New Thread
            </button>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        <button onClick={() => setActiveTag(null)} style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 12, border: "1px solid var(--border)", background: activeTag === null ? "var(--ink)" : "transparent", color: activeTag === null ? "var(--surface)" : "var(--ink-2)", cursor: "pointer", fontWeight: activeTag === null ? 600 : 400 }}>All</button>
        {ALL_FORUM_TAGS.map(t => {
          const tc = TAG_COLORS[t] || TAG_COLORS.General;
          const isActive = activeTag === t;
          return (
            <button key={t} onClick={() => setActiveTag(isActive ? null : t)} style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 12, border: `1px solid ${isActive ? tc.color : 'var(--border)'}`, background: isActive ? tc.bg : "transparent", color: isActive ? tc.color : "var(--ink-2)", cursor: "pointer", fontWeight: isActive ? 700 : 400 }}>{t}</button>
          );
        })}
      </div>
      {!forumsEnabled && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, color: "var(--ink-2)" }}>
          <I.lock style={{ width: 18, height: 18, opacity: 0.5 }} />
          <span style={{ fontSize: 14 }}>The discussion forum is disabled for this group.</span>
        </div>
      )}
      {!canPost && forumsEnabled && isMember && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, color: "var(--ink-2)" }}>
          <I.lock style={{ width: 16, height: 16, opacity: 0.5 }} />
          <span style={{ fontSize: 13 }}>Only moderators, admins or selected members can create new threads.</span>
        </div>
      )}
      {!isMember && isPublicGroup && forumsEnabled && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Join this group to create threads and reply to discussions.</span>
          <button className="hbtn hbtn--primary hbtn--sm" onClick={handleJoinClick}>{isPending ? "Pending" : "Join group"}</button>
        </div>
      )}
      {filteredPosts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-3)", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--border)" }}>
          <I.comment style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.3 }} />
          <h4 style={{ margin: "0 0 8px 0", color: "var(--ink)", fontSize: 16 }}>No threads {activeTag || searchQuery ? "found" : "yet"}.</h4>
          <p style={{ margin: 0 }}>{activeTag || searchQuery ? "Try a different filter or search." : canPost ? "Start the first discussion." : "No discussions yet."}</p>
        </div>
      ) : (
        filteredPosts.map((p: any) => (
          <ThreadCard key={p.id} p={p} onOpen={openThread} voteData={threadVotes[p.id]} onVote={handleVoteThread} reactions={threadReactions[p.id]} onReact={handleReactThread} isLiked={myLikes.has(p.id)} onLike={handleLikeThread} />
        ))
      )}
      <NewDiscussionModal
        showNewThreadModal={showNewThreadModal}
        setShowNewThreadModal={setShowNewThreadModal}
        newThreadTitle={newThreadTitle}
        setNewThreadTitle={setNewThreadTitle}
        newThreadBody={newThreadBody}
        setNewThreadBody={setNewThreadBody}
        newThreadTag={newThreadTag}
        setNewThreadTag={setNewThreadTag}
        postingThread={postingThread}
        handleNewThread={handleNewThread}
      />
    </div>
  );
}
