import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	content: {
		flexGrow: 1,
		flexShrink: 1
	},
	message: {
		padding: 12,
		paddingTop: 6,
		paddingBottom: 6,
		flexDirection: 'row',
		transform: [{ scaleY: -1 }]
	},
	textInfo: {
		fontStyle: 'italic',
		color: '#a0a0a0'
	},
	editing: {
		backgroundColor: '#fff5df'
	},
	firstUnread: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 15
	},
	firstUnreadLine: {
		borderTopColor: 'red',
		borderTopWidth: 1,
		flex: 1
	},
	firstUnreadBadge: {
		color: 'red',
		backgroundColor: '#fff',
		fontSize: 11,
		paddingHorizontal: 5
	}
});
