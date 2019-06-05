import { StyleSheet } from 'react-native';

import {
	COLOR_SEPARATOR, COLOR_WHITE, COLOR_BACKGROUND_CONTAINER
} from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	contentContainer: {
		...sharedStyles.separatorVertical,
		backgroundColor: COLOR_WHITE,
		marginVertical: 10
	},
	container: {
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
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
		fontSize: 14,
		marginStart: 20,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	sectionItem: {
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
		...sharedStyles.separatorVertical,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		height: 10
	},
	switch: {
		marginHorizontal: 10
	},
	rectButton: {
		backgroundColor: COLOR_WHITE,
		paddingHorizontal: 5
	},
	infoButton: {
		flex: 1,
		paddingVertical: 20,
		justifyContent: 'space-between',
		alignItems: 'center'
	}
});
