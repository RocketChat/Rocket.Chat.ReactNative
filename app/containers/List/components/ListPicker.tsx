import { type ReactElement } from 'react';

interface IListPickerOption<T extends string> {
	label: string;
	value: T;
	testID?: string;
}

export interface IListPicker<T extends string = string> {
	title: string;
	testID?: string;
	options: IListPickerOption<T>[];
	selection: T;
	onSelectionChange: (value: T) => void;
	children: ReactElement;
}

const ListPicker = <T extends string>({ children }: IListPicker<T>) => children;

export default ListPicker;
