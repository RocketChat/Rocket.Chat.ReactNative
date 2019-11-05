import { StyleSheet } from 'react-native';

import {
	COLOR_PRIMARY, COLOR_WHITE, COLOR_TEXT_DESCRIPTION
} from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
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
		...sharedStyles.textMedium
	}
});
