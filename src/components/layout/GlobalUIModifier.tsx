'use client';

import { useEffect, useState } from 'react';

const HIDDEN_KEY = 'reptrack_hidden_elements';

export interface HiddenElement {
  id: string;
  elementId: string;
  label: string;
  section: string;
  elementType: string;
  isHidden: boolean;
}

function loadHiddenElements(): HiddenElement[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isElementHidden(elementId: string): boolean {
  const elements = loadHiddenElements();
  return elements.some((e) => e.elementId === elementId && e.isHidden);
}

export function GlobalUIModifier() {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const applyStyles = () => {
      const elements = loadHiddenElements().filter((e) => e.isHidden);
      let styleTag = document.getElementById('reptrack-ui-modifier-styles') as HTMLStyleElement | null;
      
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'reptrack-ui-modifier-styles';
        document.head.appendChild(styleTag);
      }

      if (!elements.length) {
        styleTag.textContent = '';
        return;
      }

      const cssRules = elements
        .map((e) => {
          const target = e.elementId.trim();
          if (!target) return '';
          
          // Build comprehensive selectors matching target (raw selector, #id, .class, or data-ui-id)
          const selectors: string[] = [target];
          if (!target.startsWith('#') && !target.startsWith('.') && !target.startsWith('[')) {
            selectors.push(`#${target}`, `.${target}`, `[data-ui-id="${target}"]`);
          }
          return `${selectors.join(', ')} { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }`;
        })
        .filter(Boolean)
        .join('\n');

      styleTag.textContent = cssRules;
    };

    applyStyles();

    const handleUpdate = () => {
      applyStyles();
      setVersion((v) => v + 1);
    };

    window.addEventListener('reptrack_admin_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('reptrack_admin_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return null;
}
