import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// Minimal mock DOM elements to allow React 18 createRoot to render in Node environment
class FakeElement {
  nodeName: string;
  tagName: string;
  nodeType = 1;
  childNodes: any[] = [];
  style: Record<string, string> = {};
  ownerDocument: any;

  constructor(nodeName = 'div') {
    this.nodeName = nodeName;
    this.tagName = nodeName.toUpperCase();
    this.ownerDocument = (globalThis as any).document;
  }

  appendChild(child: any) {
    this.childNodes.push(child);
    return child;
  }

  removeChild(child: any) {
    const idx = this.childNodes.indexOf(child);
    if (idx !== -1) this.childNodes.splice(idx, 1);
    return child;
  }

  insertBefore(newChild: any, refChild: any) {
    const idx = this.childNodes.indexOf(refChild);
    if (idx === -1) this.childNodes.push(newChild);
    else this.childNodes.splice(idx, 0, newChild);
    return newChild;
  }

  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
  removeAttribute() {}
}

export function setupDomGlobals(): void {
  if (typeof (globalThis as any).document === 'undefined') {
    (globalThis as any).document = {
      createElement: (tag: string) => new FakeElement(tag),
      createElementNS: (_ns: string, tag: string) => new FakeElement(tag),
      createTextNode: (text: string) => ({ nodeType: 3, nodeValue: text }),
      documentElement: new FakeElement('html'),
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }
  (globalThis as any).window = globalThis;
  (globalThis as any).HTMLIFrameElement = class {};
  (globalThis as any).Element = FakeElement;
  (globalThis as any).HTMLElement = FakeElement;
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
}

export interface HookResult<T> {
  current: T;
  unmount: () => Promise<void>;
  rerender: (newProps?: any) => Promise<void>;
}

export async function renderHook<T, P = void>(
  renderCallback: (props: P) => T,
  initialProps?: P
): Promise<HookResult<T>> {
  setupDomGlobals();

  const result = { current: undefined as unknown as T };
  let currentProps = initialProps;

  function TestHarness(props: { p?: P }) {
    const val = renderCallback(props.p as P);
    result.current = val;
    return React.isValidElement(val) ? val : null;
  }

  const container = new FakeElement('div');
  const root: Root = createRoot(container as any);

  await act(async () => {
    root.render(React.createElement(TestHarness, { p: currentProps }));
  });

  return {
    get current() {
      return result.current;
    },
    async rerender(newProps?: P) {
      currentProps = newProps;
      await act(async () => {
        root.render(React.createElement(TestHarness, { p: currentProps }));
      });
    },
    async unmount() {
      await act(async () => {
        root.unmount();
      });
    },
  };
}
