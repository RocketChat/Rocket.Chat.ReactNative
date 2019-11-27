import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';
import {
	COLOR_BORDER, COLOR_PRIMARY, COLOR_WHITE
} from '../../constants/colors';
import { isTablet } from '../../utils/deviceInfo';

export default StyleSheet.create({
	root: {
		flexDirection: 'row'
	},
	container: {
		paddingVertical: 4,
		width: '100%',
		paddingHorizontal: 14,
		flexDirection: 'column'
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
		flexDirection: 'row'
		// flex: 1
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
		paddingLeft: 10,
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
	imageContainer: {
		// flex: 1,
		flexDirection: 'column',
		borderRadius: 4
	},
	image: {
		width: '100%',
		// maxWidth: 400,
		minHeight: isTablet ? 300 : 200,
		borderRadius: 4,
		borderColor: COLOR_BORDER,
		borderWidth: 1
	},
	imagePressed: {
		opacity: 0.5
	},
	inlineImage: {
		width: 300,
		height: 300,
		resizeMode: 'contain'
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
		// flex: 1,
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
	},
	readReceipt: {
		lineHeight: 20
	}
});
