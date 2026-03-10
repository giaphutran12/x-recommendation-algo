'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Header from './_components/header';
import Feed from './_components/feed';
import AlgorithmPanel from './_components/algorithm-panel';

export default function V5Home() {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [feedVersion, setFeedVersion] = useState(0);

  useEffect(() => {
    setPortalTarget(document.getElementById('v5-algorithm-panel'));
  }, []);

  return (
    <>
      <Header />
      <Feed feedVersion={feedVersion} />
      {portalTarget &&
        createPortal(
          <AlgorithmPanel
            onUpdateFeed={() => setFeedVersion((v) => v + 1)}
          />,
          portalTarget
        )}
    </>
  );
}
