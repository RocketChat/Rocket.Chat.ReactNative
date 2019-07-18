import { StyleSheet } from 'react-native';
import { isIOS } from '../../utils/deviceInfo';
import sharedStyles from '../Styles';

import {
	COLOR_BACKGROUND_CONTAINER, COLOR_WHITE, COLOR_DANGER
} from '../../constants/colors';

export default StyleSheet.create({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER
	},
	content: {
		flex: 1,
		backgroundColor: isIOS ? COLOR_WHITE : '#E1E5E8'
	},
	flatlist: {
		width: '100%',
		backgroundColor: COLOR_WHITE
	},
	bordered: {
		...sharedStyles.separatorVertical
	},
	scroll: {
		width: '100%'
	},
	headerContainer: {
		paddingHorizontal: 15,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		paddingBottom: 10,
		paddingTop: 17
	},
	headerText: {
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular,
		fontSize: 17,
		letterSpacing: 0.27,
		flex: 1
	},
	separator: {
		...sharedStyles.separatorBottom,
		marginLeft: 48
	},
	loading: {
		flex: 1
	},
	errorIcon: {
		color: COLOR_DANGER
	},
	fileMime: {
		...sharedStyles.textColorNormal,
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter,
		fontSize: 20,
		marginBottom: 20
	},
	title: {
		fontSize: 14,
		...sharedStyles.textColorTitle,
		...sharedStyles.textBold
	}
});
