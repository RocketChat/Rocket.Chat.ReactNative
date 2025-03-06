import { StyleSheet } from 'react-native';

import { isTablet } from '../../lib/methods/helpers';
import sharedStyles from '../../views/Styles';

export const styles = StyleSheet.create({
	headerBackButton: {
		margin: 0,
		marginRight: isTablet ? 5 : -5
	}
});
