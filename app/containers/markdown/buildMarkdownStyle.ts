import { Platform } from 'react-native';
import { type MarkdownStyle } from 'react-native-enriched-markdown';

import { type TColors } from '~/theme';

const codeFontFamily = Platform.select({ ios: 'Courier New', android: 'monospace' });

export const buildMarkdownStyle = (colors: TColors, isBigEmojiOnly: boolean): MarkdownStyle => ({
	paragraph: {
		fontSize: isBigEmojiOnly ? 30 : 16,
		lineHeight: isBigEmojiOnly ? 43 : 22,
		color: colors.fontDefault
	},
	h1: { fontSize: 24, lineHeight: 30, fontWeight: 'bold', color: colors.fontDefault },
	h2: { fontSize: 22, lineHeight: 28, fontWeight: 'bold', color: colors.fontDefault },
	h3: { fontSize: 20, lineHeight: 26, fontWeight: '600', color: colors.fontDefault },
	h4: { fontSize: 18, lineHeight: 24, fontWeight: '600', color: colors.fontDefault },
	blockquote: {
		borderColor: colors.strokeLight,
		backgroundColor: colors.strokeLight,
		borderWidth: 0,
		padding: 4
	},
	list: {
		color: colors.fontDefault
	},
	code: {
		fontFamily: codeFontFamily,
		color: colors.fontDefault,
		backgroundColor: colors.surfaceNeutral,
		borderColor: colors.strokeLight
	},
	codeBlock: {
		fontFamily: codeFontFamily,
		color: colors.fontDefault,
		backgroundColor: colors.surfaceNeutral,
		borderColor: colors.strokeLight,
		borderWidth: 1,
		borderRadius: 4,
		padding: 4
	},
	link: {
		color: colors.fontInfo
	},
	linkVariants: {
		'^user://(all|here)$': { color: colors.statusFontService },
		'user://[^?]+\\?me=1$': { color: colors.statusFontDanger },
		'user://[^?]+\\?team=1$': { color: colors.statusFontWarning },
		'^user://': { color: colors.statusFontWarning },
		'^channel://': { color: colors.fontInfo },
		'^timestamp://': { color: colors.fontDefault, backgroundColor: colors.surfaceSelected }
	},
	image: {
		maxHeight: isBigEmojiOnly ? 30 : 300,
		resizeMode: 'contain'
	},
	inlineImage: {
		size: isBigEmojiOnly ? 30 : 15
	},
	taskList: {
		checkedColor: colors.fontDefault
	}
});
