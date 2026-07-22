// home-group.tsx — backward-compatibility re-exports
// All logic has been moved to client/src/group-detail/
// This file must contain only re-exports. No logic allowed here.

export { GroupDetail } from './group-detail/GroupDetail';
export { MyGroups } from './group-detail/MyGroups';
export { MemberManagementPanel } from './group-detail/components/members/MemberManagementPanel';

// Shared utilities consumed by other files outside group-detail/
export { TAG_COLORS, ALL_FORUM_TAGS, EMOJIS } from './group-detail/utils/constants';
export { getRelativeTime } from './group-detail/utils/date';
export { TagPill } from './group-detail/components/discussion/TagPill';
export { VoteWidget } from './group-detail/components/discussion/VoteWidget';
export { EmojiBar } from './group-detail/components/discussion/EmojiBar';
export { SortBar } from './group-detail/components/discussion/SortBar';
export { ThreadCard } from './group-detail/components/discussion/ThreadCard';
export { CommentItem } from './group-detail/components/discussion/CommentItem';
export { MemberOnlyScreen } from './group-detail/components/common/MemberOnlyScreen';
export { ConductedEventsSection } from './group-detail/components/about/ConductedEventsSection';
