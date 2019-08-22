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
	emph: {
		fontStyle: 'italic'
	},
	strong: {
		fontWeight: 'bold'
	},
	del: {
		textDecorationLine: 'line-through'
	},
	text: {
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	textBig: {
		fontSize: 30,
		...sharedStyles.textColorNormal,
		...sharedStyles.textRegular
	},
	textInfo: {
		fontStyle: 'italic',
		fontSize: 16,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	customEmoji: {
		width: 20,
		height: 20
	},
	customEmojiBig: {
		width: 30,
		height: 30
	},
	temp: { opacity: 0.3 },
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
	inlineImage: {
		width: 300,
		height: 300,
		resizeMode: 'contain'
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
	edited: {
		fontSize: 14,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	heading1Text: {
		...sharedStyles.textBold,
		fontSize: 24
	},
	heading2Text: {
		...sharedStyles.textBold,
		fontSize: 22
	},
	heading3Text: {
		...sharedStyles.textSemibold,
		fontSize: 20
	},
	heading4Text: {
		...sharedStyles.textSemibold,
		fontSize: 18
	},
	heading5Text: {
		...sharedStyles.textMedium,
		fontSize: 16
	},
	heading6Text: {
		...sharedStyles.textMedium,
		fontSize: 14
	}
});
