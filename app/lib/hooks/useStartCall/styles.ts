import { StyleSheet } from 'react-native';

import sharedStyles from '../../../views/Styles';

export const ROW_HEIGHT = 56;

export default StyleSheet.create({
	container: {
		height: 44,
		padding: 12,
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center'
	},
	optionText: {
		fontSize: 16,
		textAlign: 'center',
		...sharedStyles.textRegular
	},
	serverHeaderAdd: {
		fontSize: 16,
		marginRight: 12,
		paddingVertical: 10,
		...sharedStyles.textRegular
	},
	buttonCreateWorkspace: {
		height: 46,
		justifyContent: 'center',
		marginBottom: 0
	}
});
