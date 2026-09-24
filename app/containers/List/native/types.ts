import { type ReactNode } from 'react';

import { type IListItem } from '../ListItem';

export interface INativeListItem {
	item: IListItem;
}

export interface INativeListSection {
	children: ReactNode;
	title?: string;
	translateTitle?: boolean;
}

export interface INativeListPickerOption {
	label: string;
	value: string;
	testID?: string;
}

export interface INativeListPicker {
	title: string;
	testID?: string;
	options: INativeListPickerOption[];
	selection: string;
	onSelectionChange: (value: string) => void;
}
