import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
	messageContent: {
		flex: 1,
		marginLeft: 30
	},
	flex: {
		flexDirection: 'row',
		flex: 1
	},
	message: {
		paddingHorizontal: 12,
		paddingVertical: 3,
		flexDirection: 'column',
		transform: [{ scaleY: -1 }],
		flex: 1
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
	temp: { opacity: 0.3 },
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
		flexWrap: 'wrap',
		marginTop: 6
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
	},
	avatar: {
		marginRight: 10
	},
	reactedContainer: {
		borderColor: '#bde1fe',
		backgroundColor: '#f3f9ff'
	},
	reactedCountText: {
		color: '#4fb0fc'
	},
	errorIcon: {
		padding: 10,
		paddingRight: 12,
		paddingLeft: 0
	},
	broadcastButton: {
		borderColor: '#1d74f5',
		borderWidth: 2,
		borderRadius: 2,
		paddingVertical: 10,
		width: 100,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 6
	},
	broadcastButtonText: {
		color: '#1d74f5'
	},
	mention: {
		color: '#13679a'
	},
	paragraph: {
		marginTop: 0,
		marginBottom: 0,
		flexWrap: 'wrap',
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'flex-start'
	}
});
