import { StyleSheet } from 'react-native';

import sharedStyles from '../../../Styles';

export default StyleSheet.create({
	container: {
		paddingTop: 16,
		paddingLeft: 16,
		paddingRight: 16,
		paddingBottom: 32
	},
	titleContainer: {
		paddingRight: 80,
		marginBottom: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	titleContainerText: {
		fontSize: 16,
		...sharedStyles.textSemibold,
		paddingLeft: 16
	},
	subTitleContainerText: {
		fontSize: 14,
		...sharedStyles.textRegular,
		marginBottom: 10
	}
});
