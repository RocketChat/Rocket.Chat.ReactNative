import { type ComponentType } from 'react';

const markedSections = new WeakSet<object>();

export const asNativeListSection = <Component extends ComponentType<any>>(component: Component): Component => {
	markedSections.add(component);
	return component;
};

export const isNativeListSection = (type: unknown) =>
	(typeof type === 'function' || (typeof type === 'object' && type !== null)) && markedSections.has(type);
