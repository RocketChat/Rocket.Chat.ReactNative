import { KeyboardAwareScrollViewProps } from 'react-native-keyboard-controller';

const scrollPersistTaps: Partial<KeyboardAwareScrollViewProps> = {
	keyboardShouldPersistTaps: 'handled',
	keyboardDismissMode: 'interactive'
};

export default scrollPersistTaps;
