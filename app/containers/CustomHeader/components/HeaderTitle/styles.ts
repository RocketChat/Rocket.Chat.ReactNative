import { StyleSheet } from 'react-native';

import sharedStyles from '../../../../views/Styles';

export default StyleSheet.create({
	title: {
		flexShrink: 1,
		...sharedStyles.textSemibold
	}
});
