import { StyleSheet, Platform } from 'react-native';

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
	customEmoji: {
		width: 16,
		height: 16
	},
	codeStyle: {
		...Platform.select({
			ios: { fontFamily: 'Courier New' },
			android: { fontFamily: 'monospace' }
		}),
		backgroundColor: '#f8f8f8',
		borderColor: '#cccccc',
		borderWidth: 1,
		borderRadius: 5,
		padding: 5
	},
	reactionsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	reactionContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 3,
		borderWidth: 1,
		borderColor: '#cccccc',
		borderRadius: 4,
		marginRight: 5,
		marginBottom: 5,
		height: 23,
		width: 35
	},
	reactionCount: {
		fontSize: 12,
		marginLeft: 2,
		fontWeight: '600',
		color: '#aaaaaa'
	},
	reactionEmoji: {
		fontSize: 12
	},
	reactionCustomEmoji: {
		width: 15,
		height: 15
	}
});
