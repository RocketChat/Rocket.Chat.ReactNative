import { Children, cloneElement, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';

import ListSeparator from './ListSeparator';

export const flattenListChildren = (children: ReactNode, keyPrefix = ''): ReactElement[] =>
	Children.toArray(children).flatMap(child => {
		if (!isValidElement<{ children?: ReactNode }>(child)) {
			return [];
		}
		const key = `${keyPrefix}${child.key}`;
		return child.type === Fragment ? flattenListChildren(child.props.children, key) : [cloneElement(child, { key })];
	});

export const isListSeparator = (element: ReactElement) => element.type === ListSeparator;
