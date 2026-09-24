import { type ComponentType } from 'react';

const nativeListRowTypes = new WeakSet<object>();

export const asNativeListRow = <Component extends ComponentType<any>>(component: Component): Component => {
	nativeListRowTypes.add(component);
	return component;
};

export const isNativeListRow = (type: unknown) =>
	(typeof type === 'function' || (typeof type === 'object' && type !== null)) && nativeListRowTypes.has(type);

const nativeListSectionTypes = new WeakSet<object>();

export const asNativeListSection = <Component extends ComponentType<any>>(component: Component): Component => {
	nativeListSectionTypes.add(component);
	return component;
};

export const isNativeListSection = (type: unknown) =>
	(typeof type === 'function' || (typeof type === 'object' && type !== null)) && nativeListSectionTypes.has(type);
