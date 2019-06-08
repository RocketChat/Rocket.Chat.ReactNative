import { StyleSheet } from 'react-native';
import { isIOS } from '../../utils/deviceInfo';

import {
	COLOR_BACKGROUND_CONTAINER, COLOR_WHITE, COLOR_TEXT, HEADER_BACK, COLOR_SEPARATOR
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
		backgroundColor: isIOS ? COLOR_WHITE : '#E1E5E8',
		width: '100%'
	},
	flatlist: {
		width: '100%',
		backgroundColor: COLOR_WHITE
	},
	bordered: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR
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
		color: isIOS ? COLOR_TEXT : '#54585E',
		fontSize: isIOS ? 17 : 10,
		letterSpacing: 0.27,
		flex: 1
	},
	cancelButton: {
		marginLeft: 16
	},
	cancel: {
		color: HEADER_BACK,
		fontSize: 16
	},
	separator: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR,
		marginLeft: 48
	}
});
