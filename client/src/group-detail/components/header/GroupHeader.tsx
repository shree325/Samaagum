import React from 'react';
import { I } from '../../../home-icons';
import { ShareDialog } from './ShareDialog';
import { JoinButton } from './JoinButton';

interface GroupHeaderProps {
  g: any;
  membersCount: number;
  onlineCount: number;
  isCustomIcon: boolean;
  iconSrc: string | null;
  displayLocation: string | null;
  canShare: boolean;
  showShareSheet: boolean;
  setShowShareSheet: (val: boolean) => void;
  isOwner: boolean;
  capacityFull: boolean;
  hasWaitlist: boolean;
  isJoined: boolean;
  isPending: boolean;
  handleJoinClick: () => void;
  handleLeaveClick: () => void;
  handleCancelJoinRequestClick: () => void;
  go: (dest: string, arg?: any) => void;
}

export function GroupHeader({
  g,
  membersCount,
  onlineCount,
  isCustomIcon,
  iconSrc,
  displayLocation,
  canShare,
  showShareSheet,
  setShowShareSheet,
  isOwner,
  capacityFull,
  hasWaitlist,
  isJoined,
  isPending,
  handleJoinClick,
  handleLeaveClick,
  handleCancelJoinRequestClick,
  go
}: GroupHeaderProps) {
  return (
    <div className="grp-head">
      <div className="gicon-lg" style={{ background: g.cover, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {isCustomIcon && iconSrc ? (
          <img src={iconSrc} alt="icon" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
        ) : g.icon}
      </div>
      <div className="gh-meta">
        <div className="nm">{g.name} {g.visibility === "private" && <I.lock style={{ width: 18, height: 18, color: "var(--ink-3)", marginLeft: 6 }} title="Private" />}</div>
        <div className="sub">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.users /> {membersCount.toLocaleString()} members</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#1f9d57", fontWeight: 600 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2bb673" }} />{onlineCount} online</span>
          {(g.category || g.cat) && (
            <span className="fchip on" style={{ pointerEvents: "none", padding: "4px 11px", fontSize: 12, textTransform: 'capitalize' }}>
              {g.category || g.cat}
            </span>
          )}
        </div>
        {displayLocation && (
          <div className="sub" style={{ marginTop: 4 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.pin /> {displayLocation}</span>
          </div>
        )}
      </div>
      <div className="gh-act">
        {canShare && (
          <ShareDialog g={g} showShareSheet={showShareSheet} setShowShareSheet={setShowShareSheet} />
        )}
        <JoinButton
          g={g}
          isOwner={isOwner}
          capacityFull={capacityFull}
          hasWaitlist={hasWaitlist}
          isJoined={isJoined}
          isPending={isPending}
          handleJoinClick={handleJoinClick}
          handleLeaveClick={handleLeaveClick}
          handleCancelJoinRequestClick={handleCancelJoinRequestClick}
          go={go}
        />
      </div>
    </div>
  );
}
