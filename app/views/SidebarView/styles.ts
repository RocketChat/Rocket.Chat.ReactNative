import { StyleSheet } from 'react-native';

import { fontSize } from '../../lib/theme';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	itemCurrent: {
		backgroundColor: '#E1E5E8'
	},
	itemHorizontal: {
		marginHorizontal: 10,
		width: 30,
		alignItems: 'center'
	},
	itemCenter: {
		flex: 1
	},
	itemText: {
		marginVertical: 16,
		fontSize: fontSize[14],
		...sharedStyles.textMedium
	},
	separator: {
		borderBottomWidth: StyleSheet.hairlineWidth,
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
		fontSize: fontSize[14],
		...sharedStyles.textMedium
	},
	avatar: {
		marginHorizontal: 10
	},
	currentServerText: {
		fontSize: fontSize[14],
		...sharedStyles.textMedium
	},
	version: {
		marginHorizontal: 10,
		marginBottom: 10,
		fontSize: 13,
		...sharedStyles.textMedium
	},
	inverted: {
		transform: [{ scaleY: -1 }]
	}
});
