import React from 'react';
import { I, Grain } from '../../../home-icons';

interface GroupHeroProps {
  bannerSrc: string | null;
  cover: string;
  go: (dest: string, arg?: any) => void;
}

export function GroupHero({ bannerSrc, cover, go }: GroupHeroProps) {
  return (
    <div className="detail-cover" style={{
      height: 200,
      backgroundSize: "cover",
      backgroundPosition: "center",
      background: bannerSrc ? `url("${bannerSrc}") center/cover no-repeat` : cover
    }}>
      {!bannerSrc && <Grain />}
      <div className="scrim" />
      <button className="detail-back" onClick={() => go("back")}><I.arrowL />Back</button>
    </div>
  );
}
