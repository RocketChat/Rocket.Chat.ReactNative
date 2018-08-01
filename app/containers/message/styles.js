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
		marginTop: 10
	},
	reactionContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 4,
		marginRight: 10,
		marginBottom: 10,
		maxHeight: 28,
		backgroundColor: '#E8F2FF'
	},
	addReactionContainer: {
		paddingHorizontal: 15
	},
	reactionCount: {
		fontSize: 14,
		marginLeft: 3,
		fontWeight: '600',
		color: '#1D74F5'
	},
	reactionEmoji: {
		fontSize: 14
	},
	reactionCustomEmoji: {
		width: 20,
		height: 20
	},
	avatar: {
		marginRight: 10
	},
	reactedContainer: {
		borderWidth: 0,
		backgroundColor: '#D1DAE6'
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
	},
	imageContainer: {
		flex: 1,
		flexDirection: 'column'
	},
	image: {
		width: '100%',
		maxWidth: 400,
		height: 300
	},
	inlineImage: {
		width: 300,
		height: 300,
		resizeMode: 'contain'
	}
});
