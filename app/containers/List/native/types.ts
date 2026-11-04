import { type ReactElement, type ReactNode } from 'react';

import { type IListItem } from '../components/ListItem';

export interface INativeListItem {
	item: IListItem;
}

export interface INativeListSection {
	children: ReactNode;
	title?: string;
	translateTitle?: boolean;
	headerTrailing?: ReactElement;
}
