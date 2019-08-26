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
	container: {
		alignItems: 'flex-start',
		flexDirection: 'row'
	},
	childContainer: {
		flex: 1
	},
	block: {
		alignItems: 'flex-start',
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
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
	textBig: {
		fontSize: 30,
		...sharedStyles.textColorNormal,
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
		fontSize: 16,
		color: '#0072FE',
		padding: 5,
		...sharedStyles.textMedium,
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
		fontSize: 16,
		color: COLOR_PRIMARY,
		...sharedStyles.textRegular
	},
	edited: {
		fontSize: 14,
		...sharedStyles.textColorDescription,
		...sharedStyles.textRegular
	},
	heading1: {
		...sharedStyles.textBold,
		fontSize: 24
	},
	heading2: {
		...sharedStyles.textBold,
		fontSize: 22
	},
	heading3: {
		...sharedStyles.textSemibold,
		fontSize: 20
	},
	heading4: {
		...sharedStyles.textSemibold,
		fontSize: 18
	},
	heading5: {
		...sharedStyles.textMedium,
		fontSize: 16
	},
	heading6: {
		...sharedStyles.textMedium,
		fontSize: 14
	},
	quote: {
		height: '100%',
		width: 2,
		backgroundColor: COLOR_BORDER,
		marginRight: 5
	},
	touchableTable: {
		justifyContent: 'center'
	},
	containerTable: {
		borderBottomWidth: 1,
		borderColor: COLOR_BORDER,
		borderRightWidth: 1
	},
	table: {
		borderColor: COLOR_BORDER,
		borderLeftWidth: 1,
		borderTopWidth: 1
	},
	tableExtraBorders: {
		borderBottomWidth: 1,
		borderRightWidth: 1
	},
	row: {
		flexDirection: 'row'
	},
	rowBottomBorder: {
		borderColor: COLOR_BORDER,
		borderBottomWidth: 1
	},
	cell: {
		borderColor: COLOR_BORDER,
		justifyContent: 'flex-start',
		paddingHorizontal: 13,
		paddingVertical: 6
	},
	cellRightBorder: {
		borderRightWidth: 1
	},
	alignCenter: {
		textAlign: 'center'
	},
	alignRight: {
		textAlign: 'right'
	}
});
