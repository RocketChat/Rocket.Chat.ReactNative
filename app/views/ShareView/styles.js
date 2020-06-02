import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	// Error
	container: {
		flex: 1
	},
	centered: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	title: {
		fontSize: 18,
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter
	},
	// Header
	header: {
		width: '70%',
		justifyContent: 'center',
		flexDirection: 'row'
	},
	text: {
		fontSize: 16,
		...sharedStyles.textRegular,
		marginRight: 4
	},
	name: {
		fontSize: 16,
		...sharedStyles.textSemibold
	}
});
