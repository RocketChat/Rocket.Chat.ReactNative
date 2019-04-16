import { StyleSheet } from 'react-native';

import {
	COLOR_SEPARATOR, COLOR_PRIMARY, COLOR_WHITE, COLOR_TEXT_DESCRIPTION
} from '../../constants/colors';
import { isIOS } from '../../utils/deviceInfo';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLOR_WHITE
	},
	safeAreaView: {
		flex: 1
	},
	list: {
		flex: 1
	},
	contentContainer: {
		paddingTop: 10
	},
	separator: {
		height: 1,
		backgroundColor: COLOR_SEPARATOR
	},
	loading: {
		flex: 1,
		padding: 15,
		color: COLOR_TEXT_DESCRIPTION
	},
	readOnly: {
		justifyContent: 'flex-end',
		alignItems: 'center',
		marginVertical: 15
	},
	reactionPickerContainer: {
		// width: width - 20,
		// height: width - 20,
		backgroundColor: '#F7F7F7',
		borderRadius: 4,
		flexDirection: 'column'
	},
	joinRoomContainer: {
		justifyContent: 'flex-end',
		alignItems: 'center',
		marginVertical: 15
	},
	joinRoomButton: {
		width: 107,
		height: 44,
		marginTop: 15,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLOR_PRIMARY,
		borderRadius: 2
	},
	joinRoomText: {
		color: COLOR_WHITE,
		fontSize: 14,
		...sharedStyles.textMedium
	},
	previewMode: {
		fontSize: 16,
		...sharedStyles.textMedium,
		...sharedStyles.textColorNormal
	},
	headerTitleContainerStyle: {
		justifyContent: 'flex-start',
		left: isIOS ? 40 : 50
	}
});
