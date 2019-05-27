import { StyleSheet } from 'react-native';

import {
	COLOR_SEPARATOR, COLOR_WHITE
} from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	contentContainer: {
		backgroundColor: COLOR_WHITE,
		marginBottom: 30
	},
	container: {
		flex: 1,
		backgroundColor: '#F6F7F9'
	},
	sectionItemTitle: {
		alignSelf: 'flex-start',
		fontSize: 16,
		marginStart: 18,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	sectionItemSubTitle: {
		alignSelf: 'flex-start',
		fontSize: 12,
		marginStart: 20,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	sectionItem: {
		marginHorizontal: 5,
		backgroundColor: COLOR_WHITE,
		flex: 1,
		paddingVertical: 20,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	sectionItemDisabled: {
		opacity: 0.3
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLOR_SEPARATOR,
		marginHorizontal: 10
	},
	sectionSeparatorBorder: {
		borderColor: '#F6F7F9',
		borderWidth: 5
	},
	switch: {
		marginStart: 5
	}
});
