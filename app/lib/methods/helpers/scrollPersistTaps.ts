import { KeyboardAwareScrollViewProps } from '@codler/react-native-keyboard-aware-scroll-view';

const scrollPersistTaps: Partial<KeyboardAwareScrollViewProps> = {
	keyboardShouldPersistTaps: 'always',
	keyboardDismissMode: 'interactive'
};

export default scrollPersistTaps;
