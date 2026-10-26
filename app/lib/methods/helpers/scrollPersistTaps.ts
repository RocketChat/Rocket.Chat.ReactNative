import { type ScrollViewProps } from 'react-native';

const scrollPersistTaps: Pick<ScrollViewProps, 'keyboardShouldPersistTaps' | 'keyboardDismissMode'> = {
	keyboardShouldPersistTaps: 'handled',
	keyboardDismissMode: 'interactive'
};

export default scrollPersistTaps;
