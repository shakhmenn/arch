import type { ReactNode } from 'react';

export type ComponentFactory = () => ReactNode;
export type HOC = (component: ComponentFactory) => ComponentFactory;

export function compose(...fns: HOC[]): (component: ComponentFactory) => ComponentFactory {
  return (component: ComponentFactory) => fns.reduceRight((prev, fn) => fn(prev), component);
}
