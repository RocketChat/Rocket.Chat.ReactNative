import { StyleSheet } from 'react-native-unistyles';

import { isTablet } from '../../lib/methods/helpers';

export const styles = StyleSheet.create({
	headerBackButton: {
		margin: 0,
		marginRight: isTablet ? 5 : -5
	}
});
