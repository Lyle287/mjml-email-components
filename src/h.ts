// The element factory. Same call shape as React's createElement:
// h(type, props,...children)
// so a component is an ordinary function from props to an element tree, and the
// tree is a plain { type, props } object you can log, snapshot or diff in a test.

export type Props = { [key: string]: unknown; children?: Child[] };
export type Component = (props: Props) => Child;
export type Element = { type: string | Component; props: Props };
export type Child = Element | string | number | false | null | undefined;

export function h(
  type: string | Component,
  props?: Props | null,
  ...children: (Child | Child[])[]
): Element {
  const flat: Child[] = [];
  for (const c of children) {
    if (Array.isArray(c)) flat.push(...c);
    else flat.push(c);
  }
  return { type, props: {...(props ?? {}), children: flat } };
}

// Reading children is fiddly enough (single child, array, undefined) that every
// component would repeat it. This normalises once.
export function childrenOf(props: Props): Child[] {
  const c = props.children;
  if (c === undefined || c === null) return [];
  return Array.isArray(c) ? (c as Child[]): [c as Child];
}
