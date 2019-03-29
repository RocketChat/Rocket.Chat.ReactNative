import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';
import { COLOR_BORDER, COLOR_PRIMARY, COLOR_WHITE } from '../../constants/colors';

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
		fontSize: 16,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
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
		marginTop: 6
	},
	reactionsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 6
	},
	reactionButton: {
		marginRight: 6,
		marginBottom: 6,
		borderRadius: 2
	},
	reactionContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 2,
		borderWidth: 1,
		borderColor: COLOR_BORDER,
		height: 28,
		minWidth: 46.3
	},
	reactedContainer: {
		borderColor: COLOR_PRIMARY
	},
	reactionCount: {
		fontSize: 14,
		marginLeft: 3,
		marginRight: 8.5,
		color: COLOR_PRIMARY,
		...sharedStyles.textSemibold
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
		color: COLOR_PRIMARY
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
		backgroundColor: COLOR_PRIMARY,
		borderRadius: 4
	},
	broadcastButtonIcon: {
		color: COLOR_WHITE,
		marginRight: 11
	},
	broadcastButtonText: {
		color: COLOR_WHITE,
		fontSize: 14,
		...sharedStyles.textMedium
	},
	mention: {
		...sharedStyles.textMedium,
		color: '#0072FE',
		padding: 5,
		backgroundColor: '#E8F2FF'
	},
	mentionLoggedUser: {
		color: COLOR_WHITE,
		backgroundColor: COLOR_PRIMARY
	},
	mentionAll: {
		color: COLOR_WHITE,
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
		borderColor: COLOR_BORDER,
		borderWidth: 1,
		borderRadius: 4
	},
	image: {
		width: '100%',
		maxWidth: 400,
		minHeight: 200,
		borderRadius: 4,
		marginBottom: 6
	},
	inlineImage: {
		width: 300,
		height: 300,
		resizeMode: 'contain'
	},
	edited: {
		fontSize: 14,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	}
});
