import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';
import { isTablet } from '../../lib/methods/helpers';

export default StyleSheet.create({
	root: {
		flexDirection: 'row'
	},
	container: {
		paddingVertical: 4,
		width: '100%',
		paddingHorizontal: 12,
		flexDirection: 'column',
		gap: 8
	},
	contentContainer: {
		flex: 1
	},
	messageContent: {
		flex: 1,
		marginLeft: 10
	},
	flex: {
		flexDirection: 'row'
	},
	temp: { opacity: 0.3 },
	reactionsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 4
	},
	reactionButton: {
		borderRadius: 4
	},
	reactionContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 4,
		borderWidth: 1,
		minWidth: 46.3,
		gap: 4,
		paddingHorizontal: 4
	},
	reactionCount: {
		fontSize: 14,
		lineHeight: 18,
		...sharedStyles.textSemibold
	},
	reactionEmoji: {
		fontSize: 13,
		color: '#ffffff'
	},
	reactionCustomEmoji: {
		width: 19,
		height: 19
	},
	avatar: {
		marginTop: 4
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	button: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 4
	},
	buttonInnerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	buttonText: {
		fontSize: 12,
		lineHeight: 16,
		...sharedStyles.textSemibold
	},
	imageContainer: {
		flexDirection: 'column',
		borderRadius: 4
	},
	image: {
		width: '100%',
		minHeight: isTablet ? 300 : 200,
		borderRadius: 4,
		overflow: 'hidden'
	},
	discussionText: {
		fontSize: 16,
		lineHeight: 20,
		...sharedStyles.textRegular
	},
	textInfo: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	startedDiscussion: {
		fontStyle: 'italic',
		fontSize: 16,
		lineHeight: 20,
		...sharedStyles.textRegular
	},
	time: {
		fontSize: 13,
		lineHeight: 18,
		...sharedStyles.textRegular
	},
	repliedThread: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10
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
	rightIcons: {
		paddingLeft: 5
	},
	threadDetails: {
		flex: 1,
		marginLeft: 12
	},
	blurView: {
		position: 'absolute',
		borderWidth: 0,
		top: 0,
		left: 0,
		bottom: 0,
		right: 0
	},
	blurIndicator: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center'
	},
	badgeContainer: {
		position: 'absolute',
		bottom: 8,
		right: 8,
		flexDirection: 'row',
		gap: 8
	},
	privateIndicator: {
		flexDirection: 'row',
		gap: 8
	},
	privateIndicatorText: {
		fontSize: 12,
		...sharedStyles.textRegular
	},
	privateMessageDismiss: {
		fontSize: 12,
		...sharedStyles.textRegular
	}
});
