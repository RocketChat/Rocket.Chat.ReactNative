import { StyleSheet } from 'react-native';
import { COLOR_SEPARATOR, COLOR_PRIMARY } from '../../constants/colors';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff'
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
	loadingMore: {
		textAlign: 'center',
		padding: 15,
		color: '#ccc'
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
	loading: {
		flex: 1
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
		color: '#fff',
		fontSize: 14,
		...sharedStyles.textMedium
	},
	previewMode: {
		fontSize: 16,
		...sharedStyles.textMedium,
		...sharedStyles.textColorNormal
	}
});
