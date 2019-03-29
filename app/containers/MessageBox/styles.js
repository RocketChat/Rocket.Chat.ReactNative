import { StyleSheet } from 'react-native';

import { isIOS } from '../../utils/deviceInfo';
import sharedStyles from '../../views/Styles';
import {
	COLOR_BORDER, COLOR_SEPARATOR, COLOR_BACKGROUND_CONTAINER, COLOR_WHITE
} from '../../constants/colors';

const MENTION_HEIGHT = 50;

export default StyleSheet.create({
	textBox: {
		backgroundColor: COLOR_WHITE,
		flex: 0,
		alignItems: 'center',
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: COLOR_SEPARATOR,
		zIndex: 2
	},
	composer: {
		backgroundColor: COLOR_WHITE,
		flexDirection: 'column',
		borderTopColor: COLOR_SEPARATOR,
		borderTopWidth: StyleSheet.hairlineWidth
	},
	textArea: {
		flexDirection: 'row',
		alignItems: 'center',
		flexGrow: 0,
		backgroundColor: COLOR_WHITE
	},
	textBoxInput: {
		textAlignVertical: 'center',
		maxHeight: 242,
		flexGrow: 1,
		width: 1,
		// paddingVertical: 12, needs to be paddingTop/paddingBottom because of iOS/Android's TextInput differences on rendering
		paddingTop: 12,
		paddingBottom: 12,
		paddingLeft: 0,
		paddingRight: 0,
		fontSize: 17,
		letterSpacing: 0,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	editing: {
		backgroundColor: '#fff5df'
	},
	actionButton: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 60,
		height: 56
	},
	mentionList: {
		maxHeight: MENTION_HEIGHT * 4
	},
	mentionItem: {
		height: MENTION_HEIGHT,
		backgroundColor: COLOR_BACKGROUND_CONTAINER,
		borderTopWidth: 1,
		borderTopColor: COLOR_BORDER,
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
		textAlign: 'center'
	},
	fixedMentionAvatar: {
		textAlign: 'center',
		width: 46,
		fontSize: 14,
		...sharedStyles.textBold,
		...sharedStyles.textColorNormal
	},
	mentionText: {
		fontSize: 14,
		...sharedStyles.textRegular,
		...sharedStyles.textColorNormal
	},
	emojiKeyboardContainer: {
		flex: 1,
		borderTopColor: COLOR_BORDER,
		borderTopWidth: 1
	},
	iphoneXArea: {
		height: 50,
		backgroundColor: COLOR_WHITE,
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0
	}
});
