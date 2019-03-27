import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	root: {
		flexDirection: 'row'
	},
	container: {
		paddingVertical: 4,
		width: '100%',
		paddingHorizontal: 14,
		flexDirection: 'column',
		flex: 1
	},
	messageContent: {
		flex: 1,
		marginLeft: 46
	},
	messageContentWithHeader: {
		marginLeft: 10
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
	marginTop: {
		marginTop: 10
	},
	reactionsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 10
	},
	reactionButton: {
		marginRight: 10,
		marginBottom: 10,
		borderRadius: 2
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
		marginTop: 4
	},
	addReaction: {
		color: '#1D74F5'
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
		color: '#fff',
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
		flexDirection: 'column',
		borderColor: '#F3F4F5',
		borderWidth: 1,
		borderRadius: 4
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
