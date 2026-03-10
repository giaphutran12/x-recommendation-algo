'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlgorithmPanel } from './algorithm-panel';

export function AlgorithmPanelPortal() {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById('v2-algorithm-panel');
    setContainer(el);
  }, []);

  if (!container) return null;
  return createPortal(<AlgorithmPanel />, container);
}
