import { FlatListProps } from 'react-native';

const scrollPersistTaps: Partial<FlatListProps<any>> = {
	keyboardShouldPersistTaps: 'handled',
	keyboardDismissMode: 'interactive'
};

export default scrollPersistTaps;
