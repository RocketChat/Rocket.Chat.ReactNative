import { StyleSheet } from 'react-native';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	innerContainer: {
		paddingHorizontal: 20
	},
	divider: {
		width: '100%',
		height: StyleSheet.hairlineWidth,
		marginVertical: 20
	},
	sectionSeparatorBorder: {
		height: 10
	},
	marginBottom: {
		height: 30
	},
	contentContainer: {
		marginVertical: 10
	},
	infoText: {
		...sharedStyles.textRegular,
		fontSize: 13,
		paddingHorizontal: 15,
		paddingVertical: 10
	},
	sectionTitle: {
		...sharedStyles.separatorBottom,
		paddingHorizontal: 15,
		paddingVertical: 10,
		fontSize: 14
	},
	viewContainer: {
		justifyContent: 'center'
	},
	pickerText: {
		...sharedStyles.textRegular,
		fontSize: 16
	}
});
