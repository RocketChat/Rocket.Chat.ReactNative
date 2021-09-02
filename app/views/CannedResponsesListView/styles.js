import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	containerHeader: {
		height: 92,
		paddingTop: 12,
		paddingHorizontal: 16,
		paddingBottom: 8
	},
	containerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 16,
		justifyContent: 'space-between'
	},
	label: {
		marginBottom: 10,
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	selectDepartment: {
		width: 136,
		height: 40,
		borderWidth: 2,
		minHeight: 0
	},
	searchBox: {
		alignItems: 'center',
		flexDirection: 'row',
		fontSize: 17,
		height: 40,
		paddingHorizontal: 16,
		borderWidth: 2,
		width: 200
	},
	inputSearch: {
		flex: 1,
		fontSize: 17,
		marginLeft: 8,
		paddingTop: 0,
		paddingBottom: 0,
		...sharedStyles.textRegular
	}
});
