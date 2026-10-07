import { type ReactElement } from 'react';

interface IListPickerOption {
	label: string;
	value: string;
	testID?: string;
}

export interface IListPicker {
	title: string;
	testID?: string;
	options: IListPickerOption[];
	selection: string;
	onSelectionChange: (value: string) => void;
	children: ReactElement;
}

const ListPicker = ({ children }: IListPicker) => children;

export default ListPicker;
