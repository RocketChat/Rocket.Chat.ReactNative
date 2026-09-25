import { type ComponentType } from 'react';

const createComponentMarker = () => {
	const markedTypes = new WeakSet<object>();
	const mark = <Component extends ComponentType<any>>(component: Component): Component => {
		markedTypes.add(component);
		return component;
	};
	const isMarked = (type: unknown) =>
		(typeof type === 'function' || (typeof type === 'object' && type !== null)) && markedTypes.has(type);
	return [mark, isMarked] as const;
};

export const [asNativeListRow, isNativeListRow] = createComponentMarker();

export const [asNativeListSection, isNativeListSection] = createComponentMarker();
