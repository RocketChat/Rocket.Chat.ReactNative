import { StyleSheet } from 'react-native';

import sharedStyles from '../../../views/Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	titleView: {
		justifyContent: 'center'
	},
	subtitleView: {
		justifyContent: 'center',
		height: 32
	},
	row: {
		flex: 0,
		alignItems: 'center',
		justifyContent: 'center'
	},
	colButton: {
		flex: 0,
		marginLeft: 12,
		marginRight: 12,
		alignItems: 'center',
		width: 78
	},
	buttonText: {
		fontSize: 28,
		...sharedStyles.textRegular
	},
	buttonView: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 78,
		borderRadius: 4
	},
	textTitle: {
		fontSize: 22,
		...sharedStyles.textRegular
	},
	textSubtitle: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	dotsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 24,
		marginBottom: 40
	},
	dotsView: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 16
	},
	grid: {
		justifyContent: 'center',
		flexDirection: 'column'
	},
	iconView: {
		marginVertical: 16
	}
});
