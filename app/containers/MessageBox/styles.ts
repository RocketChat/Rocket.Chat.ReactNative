import { StyleSheet } from 'react-native';

import { isIOS } from '../../lib/methods/helpers';
import sharedStyles from '../../views/Styles';

const MENTION_HEIGHT = 50;
const SCROLLVIEW_MENTION_HEIGHT = 4 * MENTION_HEIGHT;

export default StyleSheet.create({
	composer: {
		flexDirection: 'column',
		borderTopWidth: 1
	},
	textArea: {
		flexDirection: 'row',
		alignItems: 'center',
		flexGrow: 0
	},
	textBoxInput: {
		textAlignVertical: 'center',
		maxHeight: 240,
		flexGrow: 1,
		width: 1,
		// paddingVertical: 12, needs to be paddingTop/paddingBottom because of iOS/Android's TextInput differences on rendering
		paddingTop: 12,
		paddingBottom: 12,
		paddingLeft: 0,
		paddingRight: 0,
		fontSize: 16,
		letterSpacing: 0,
		...sharedStyles.textRegular
	},
	actionButton: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 60,
		height: 48
	},
	wrapMentionHeaderList: {
		height: MENTION_HEIGHT,
		justifyContent: 'center'
	},
	wrapMentionHeaderListRow: {
		height: MENTION_HEIGHT,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12
	},
	loadingPaddingHeader: {
		paddingRight: 12
	},
	mentionHeaderList: {
		fontSize: 14,
		...sharedStyles.textMedium
	},
	mentionHeaderListNoMatchFound: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	mentionNoMatchHeader: {
		justifyContent: 'space-between'
	},
	mentionList: {
		maxHeight: MENTION_HEIGHT * 4
	},
	mentionItem: {
		height: MENTION_HEIGHT,
		borderTopWidth: StyleSheet.hairlineWidth,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 5
	},
	mentionItemCustomEmoji: {
		margin: 8,
		width: 30,
		height: 30
	},
	mentionItemEmoji: {
		width: 46,
		height: 36,
		fontSize: isIOS ? 30 : 25,
		...sharedStyles.textAlignCenter
	},
	fixedMentionAvatar: {
		width: 46,
		fontSize: 14,
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter
	},
	mentionText: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	cannedMentionText: {
		flex: 1,
		fontSize: 14,
		paddingRight: 12,
		...sharedStyles.textRegular
	},
	cannedItem: {
		fontSize: 14,
		...sharedStyles.textBold,
		paddingLeft: 12,
		paddingRight: 8
	},
	emojiKeyboardContainer: {
		flex: 1,
		borderTopWidth: StyleSheet.hairlineWidth
	},
	slash: {
		height: 30,
		width: 30,
		padding: 5,
		paddingHorizontal: 12,
		marginHorizontal: 10,
		borderRadius: 2
	},
	commandPreviewImage: {
		justifyContent: 'center',
		margin: 3,
		width: 120,
		height: 80,
		borderRadius: 4
	},
	commandPreview: {
		height: 100,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	avatar: {
		margin: 8
	},
	scrollViewMention: {
		maxHeight: SCROLLVIEW_MENTION_HEIGHT
	},
	recordingContent: {
		flexDirection: 'row',
		flex: 1,
		justifyContent: 'space-between'
	},
	recordingDurationText: {
		width: 60,
		fontSize: 16,
		...sharedStyles.textRegular
	},
	buttonsWhitespace: {
		width: 15
	},
	sendToChannelButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 18
	},
	sendToChannelText: {
		fontSize: 12,
		marginLeft: 4,
		...sharedStyles.textRegular
	},
	searchedEmoji: {
		backgroundColor: 'transparent',
		color: '#ffffff'
	},
	emojiContainer: { justifyContent: 'center', marginHorizontal: 2 },
	emojiListContainer: { height: 50, paddingHorizontal: 5, marginVertical: 5, flexGrow: 1 },
	emojiSearchbarContainer: {
		flexDirection: 'row',
		height: 50,
		marginBottom: 15,
		justifyContent: 'center',
		alignItems: 'center'
	},
	openEmojiKeyboard: { marginHorizontal: 10, justifyContent: 'center' },
	emojiSearchbar: { padding: 10, borderRadius: 5 },
	textInputContainer: { justifyContent: 'center', marginBottom: 0, marginRight: 15 },
	listEmptyComponent: {
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	}
});
