import { StyleSheet } from 'react-native';
import { COLOR_SEPARATOR } from '../../constants/colors';

import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff'
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	itemCurrent: {
		backgroundColor: '#E1E5E8'
	},
	itemLeft: {
		marginHorizontal: 10,
		width: 30,
		alignItems: 'center'
	},
	itemCenter: {
		flex: 1
	},
	itemText: {
		marginVertical: 16,
		color: '#0C0D0F',
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	separator: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR,
		marginVertical: 4
	},
	header: {
		paddingVertical: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	headerTextContainer: {
		flex: 1,
		flexDirection: 'column',
		alignItems: 'flex-start'
	},
	headerUsername: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	username: {
		color: '#0C0D0F',
		fontSize: 14,
		...sharedStyles.textMedium
	},
	headerIcon: {
		paddingHorizontal: 10,
		color: '#0C0D0F'
	},
	avatar: {
		marginHorizontal: 10
	},
	status: {
		marginRight: 5
	},
	currentServerText: {
		color: '#0C0D0F',
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	version: {
		marginHorizontal: 5,
		marginBottom: 5,
		color: '#0C0D0F',
		fontSize: 13,
		...sharedStyles.textSemibold
	},
	inverted: {
		transform: [{ scaleY: -1 }]
	}
});
