import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingVertical: 32
	},
	multiline: {
		height: 130
	},
	label: {
		fontSize: 14,
		lineHeight: 24,
		...sharedStyles.textSemibold
	},
	inputStyle: {
		marginBottom: 0
	},
	description: {
		lineHeight: 24,
		...sharedStyles.textRegular
	},
	required: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	form: {
		gap: 12,
		paddingTop: 12
	},
	invitedHeader: {
		marginVertical: 12,
		marginHorizontal: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	invitedCount: {
		fontSize: 12,
		...sharedStyles.textRegular
	},
	invitedList: {
		gap: 8,
		paddingHorizontal: 4
	},
	list: {
		flex: 1,
		maxHeight: '25%'
	}
});
