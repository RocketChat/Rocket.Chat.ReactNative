import { Switch } from 'react-native';

export interface INativeListToggle {
	value: boolean;
	onValueChange?: (value: boolean) => void;
	disabled?: boolean;
	testID?: string;
	tintColor: string;
}

const NativeListToggle = ({ value, onValueChange, disabled, testID, tintColor }: INativeListToggle) => (
	<Switch value={value} onValueChange={onValueChange} disabled={disabled} testID={testID} trackColor={{ true: tintColor }} />
);

export default NativeListToggle;
