import { useState } from 'react';

export function useShare() {
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  return {
    showShareSheet,
    setShowShareSheet,
    shareCopied,
    setShareCopied
  };
}
