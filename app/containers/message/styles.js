import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';
import { isTablet } from '../../utils/deviceInfo';

export default StyleSheet.create({
	root: {
		flexDirection: 'row'
	},
	container: {
		 paddingVertical: 2,
		width: '100%',
		paddingHorizontal: 14,
		flexDirection: 'column'
	},
	contentContainer: {
		flex: 1
	},
	messageContent: {
		flex: 1,
		marginLeft: 46
	},
	messageContentWithHeader: {
		marginLeft: 20
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
		flexWrap: 'wrap'
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
		borderRadius: 4,
		borderWidth: 1.5,
		height: 40,
		minWidth: 60
	},
	reactionCount: {
		fontSize: 18,
		marginLeft: 5,
		marginRight: 8.5,
		...sharedStyles.textSemibold
	},
	reactionEmoji: {
		fontSize: 13,
		marginLeft: 7,
		color: '#ffffff'
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
	errorButton: {
		paddingLeft: 10,
		paddingVertical: 5
	},
	buttonContainer: {
		marginBottom: 8,
		flexDirection: 'row',
		alignItems: 'center'
	},
	button: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 6
	},
	smallButton: {
		height: 35
	},
	buttonIcon: {
		marginRight: 8
	},
	buttonText: {
		fontSize: 16,
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
		borderWidth: 1,
		overflow: 'hidden'
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
		...sharedStyles.textRegular
	},
	textInfo: {
		fontStyle: 'italic',
		fontSize: 16,
		...sharedStyles.textRegular
	},
	startedDiscussion: {
		fontStyle: 'italic',
		fontSize: 16,
		marginBottom: 6,
		...sharedStyles.textRegular
	},
	time: {
		fontSize: 14,
		paddingLeft: 10,
		lineHeight: 22,
		...sharedStyles.textRegular,
		fontWeight: '400'
	},
	repliedThread: {
		flexDirection: 'row',
		// flex: 1,
		alignItems: 'center',
		marginTop: 6,
		marginBottom: 12
	},
	repliedThreadIcon: {
		marginRight: 10,
		marginLeft: 16
	},
	repliedThreadName: {
		fontSize: 16,
		flex: 1,
		...sharedStyles.textRegular
	},
	repliedThreadDisclosure: {
		marginLeft: 4,
		marginRight: 4,
		alignItems: 'center',
		justifyContent: 'center'
	},
	threadBadge: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginLeft: 8
	},
	threadBell: {
		marginLeft: 8
	},
	readReceipt: {
		lineHeight: 20
	},
	encrypted: {
		justifyContent: 'center'
	},
	threadDetails: {
		flex: 1,
		marginLeft: 12
	}
});
