import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
	root: {
		flexDirection: 'row'
	},
	container: {
		paddingVertical: 5,
		width: '100%',
		paddingLeft: 10,
		paddingRight: 15,
		flexDirection: 'column',
		transform: [{ scaleY: -1 }],
		flex: 1
	},
	messageContent: {
		flex: 1,
		marginLeft: 51
	},
	messageContentWithHeader: {
		marginLeft: 15
	},
	messageContentWithError: {
		marginLeft: 0
	},
	flex: {
		flexDirection: 'row',
		flex: 1
	},
	textInfo: {
		fontStyle: 'italic',
		color: '#a0a0a0',
		fontSize: 16
	},
	editing: {
		backgroundColor: '#fff5df'
	},
	customEmoji: {
		width: 20,
		height: 20
	},
	temp: { opacity: 0.3 },
	marginBottom: {
		marginBottom: 10
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
		flexWrap: 'wrap',
		marginTop: 10
	},
	reactionButton: {
		marginRight: 10,
		marginBottom: 10,
		borderRadius: 4
	},
	reactionContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 4,
		borderWidth: 1.5,
		borderColor: '#e1e5e8',
		height: 28,
		minWidth: 46
	},
	reactedContainer: {
		borderColor: '#1d74f580'
	},
	reactionCount: {
		fontSize: 14,
		marginLeft: 3,
		marginRight: 8.5,
		fontWeight: '600',
		color: '#1D74F5'
	},
	reactionEmoji: {
		fontSize: 13,
		marginLeft: 7
	},
	reactionCustomEmoji: {
		width: 19,
		height: 19,
		marginLeft: 7
	},
	avatar: {
		marginTop: 5
	},
	addReaction: {
		width: 17,
		height: 17
	},
	errorButton: {
		paddingHorizontal: 15,
		paddingVertical: 5
	},
	broadcastButton: {
		width: 107,
		height: 44,
		marginTop: 15,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#1d74f5',
		borderRadius: 4
	},
	broadcastButtonIcon: {
		width: 14,
		height: 12,
		marginRight: 11
	},
	broadcastButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '500'
	},
	mention: {
		color: '#0072FE',
		fontWeight: '500',
		padding: 5,
		backgroundColor: '#E8F2FF'
	},
	mentionLoggedUser: {
		color: '#fff',
		backgroundColor: '#1D74F5'
	},
	mentionAll: {
		color: '#fff',
		backgroundColor: '#FF5B5A'
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
		minHeight: 200,
		borderRadius: 4,
		marginBottom: 10
	},
	inlineImage: {
		width: 300,
		height: 300,
		resizeMode: 'contain'
	},
	edited: {
		fontSize: 14,
		color: '#9EA2A8'
	}
});
