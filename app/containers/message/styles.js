import { StyleSheet, Platform } from 'react-native';

import sharedStyles from '../../views/Styles';
import {
	COLOR_BORDER, COLOR_PRIMARY, COLOR_WHITE, COLOR_BACKGROUND_CONTAINER
} from '../../constants/colors';

const codeFontFamily = Platform.select({
	ios: { fontFamily: 'Courier New' },
	android: { fontFamily: 'monospace' }
});

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
	text: {
		fontSize: 16,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
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
	reactionButtonReacted: {
		backgroundColor: '#e8f2ff'
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
	avatarSmall: {
		marginLeft: 16
	},
	addReaction: {
		color: COLOR_PRIMARY
	},
	errorButton: {
		paddingHorizontal: 15,
		paddingVertical: 5
	},
	buttonContainer: {
		marginTop: 6,
		flexDirection: 'row',
		alignItems: 'center'
	},
	button: {
		paddingHorizontal: 15,
		height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLOR_PRIMARY,
		borderRadius: 2
	},
	smallButton: {
		height: 30
	},
	buttonIcon: {
		color: COLOR_WHITE,
		marginRight: 6
	},
	buttonText: {
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
		borderRadius: 4
	},
	image: {
		width: '100%',
		maxWidth: 400,
		minHeight: 200,
		borderRadius: 4,
		borderColor: COLOR_BORDER,
		borderWidth: 1
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
	},
	codeInline: {
		...sharedStyles.textRegular,
		...codeFontFamily,
		borderWidth: 1,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		borderRadius: 4
	},
	codeBlock: {
		...sharedStyles.textRegular,
		...codeFontFamily,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		borderColor: COLOR_BORDER,
		borderWidth: 1,
		borderRadius: 4,
		padding: 4
	},
	link: {
		color: COLOR_PRIMARY,
		...sharedStyles.textRegular
	},
	startedDiscussion: {
		fontStyle: 'italic',
		fontSize: 16,
		marginBottom: 6,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	time: {
		fontSize: 12,
		paddingLeft: 10,
		lineHeight: 22,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular,
		fontWeight: '300'
	},
	repliedThread: {
		flexDirection: 'row',
		flex: 1,
		alignItems: 'center',
		marginTop: 6,
		marginBottom: 12
	},
	repliedThreadIcon: {
		color: COLOR_PRIMARY,
		marginRight: 10,
		marginLeft: 16
	},
	repliedThreadName: {
		fontSize: 16,
		flex: 1,
		color: COLOR_PRIMARY,
		...sharedStyles.textRegular
	}
});
