import { Platform, StyleSheet } from 'react-native';

import sharedStyles from '~/views/Styles';

const codeFontFamily = Platform.select({
	ios: { fontFamily: 'Courier New' },
	android: { fontFamily: 'monospace' }
});

export default StyleSheet.create({
	blocks: {
		gap: 2
	},
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
		flexWrap: 'wrap',
		flex: 1
	},
	emph: {
		fontStyle: 'italic'
	},
	del: {
		textDecorationLine: 'line-through'
	},
	plainText: {
		fontSize: 16,
		flexShrink: 1,
		lineHeight: 22
	},
	text: {
		lineHeight: 22,
		fontSize: 16,
		...sharedStyles.textRegular
	},
	textInfo: {
		fontStyle: 'italic',
		fontSize: 16,
		...sharedStyles.textRegular
	},
	textBig: {
		lineHeight: 43,
		fontSize: 30,
		...sharedStyles.textRegular
	},
	temp: { opacity: 0.3 },
	mention: {
		fontSize: 16,
		...sharedStyles.textSemibold
	},
	paragraph: {
		marginTop: 0,
		marginBottom: 0,
		flexWrap: 'wrap',
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'flex-start'
	},
	codeInline: {
		fontSize: 16,
		lineHeight: 22,
		...sharedStyles.textRegular,
		...codeFontFamily,
		borderWidth: 1,
		borderRadius: 4,
		paddingLeft: 2,
		paddingTop: 2
	},
	codeBlock: {
		borderWidth: 1,
		borderRadius: 4,
		padding: 4
	},
	codeBlockText: {
		fontSize: 16,
		lineHeight: 22,
		...sharedStyles.textRegular,
		...codeFontFamily
	},
	link: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	heading1: {
		...sharedStyles.textBold,
		fontSize: 24,
		lineHeight: 30
	},
	heading2: {
		...sharedStyles.textBold,
		fontSize: 22,
		lineHeight: 28
	},
	heading3: {
		...sharedStyles.textSemibold,
		fontSize: 20,
		lineHeight: 26
	},
	heading4: {
		...sharedStyles.textSemibold,
		fontSize: 18,
		lineHeight: 24
	},
	heading5: {
		...sharedStyles.textMedium,
		fontSize: 16,
		lineHeight: 22
	},
	heading6: {
		...sharedStyles.textMedium,
		fontSize: 14,
		lineHeight: 20
	},
	quote: {
		height: '100%',
		width: 2,
		marginRight: 5
	},
	tableContent: {
		minWidth: '100%'
	},
	tableContainer: {
		flexGrow: 1,
		marginVertical: 4
	},
	tableText: {
		fontSize: 14,
		lineHeight: 20
	},
	row: {
		flexDirection: 'row'
	},
	rowBottomBorder: {
		borderBottomWidth: 1
	},
	cell: {
		flexGrow: 1,
		flexShrink: 0,
		justifyContent: 'center',
		padding: 8
	},
	cellAlignCenter: {
		alignItems: 'center'
	},
	cellAlignRight: {
		alignItems: 'flex-end'
	},
	alignCenter: {
		textAlign: 'center'
	},
	alignRight: {
		textAlign: 'right'
	},
	inline: {
		flexShrink: 1,
		...sharedStyles.textRegular
	},
	listPrefix: {
		fontVariant: ['tabular-nums']
	}
});
