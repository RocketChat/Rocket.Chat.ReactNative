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

const NativeListPicker = (_: INativeListPicker) => null;

export default NativeListPicker;
