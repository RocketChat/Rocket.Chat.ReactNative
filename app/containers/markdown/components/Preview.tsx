import React from 'react';
import { Text, TextStyle } from 'react-native';

import { themes } from '../../../lib/constants/colors';
import { useTheme } from '../../../theme';
import usePreviewFormatText from '../../../lib/hooks/usePreviewFormatText';
import styles from '../styles';
import { useSelector } from 'react-redux';
import { IApplicationState } from '../../../definitions';
import CustomEmoji from '../../EmojiPicker/CustomEmoji';

interface IMarkdownPreview {
	msg?: string;
	numberOfLines?: number;
	testID?: string;
	style?: TextStyle[];
}

const MarkdownPreview = ({ msg, numberOfLines = 1, style = [], testID }: IMarkdownPreview) => {
	const { theme } = useTheme();
	const formattedText = usePreviewFormatText(msg ?? '');
	const customEmojis = useSelector((state: IApplicationState) => state.customEmojis);

	if (!msg) {
		return null;
	}

	function getCustomEmoji(name: string) {
		const emoji = customEmojis[name];
		return emoji ?? null;
	}

	function parseText(input: string) {
		const emojiPattern = /(:[a-zA-Z0-9_+-]+:)/g;
		const emojiRegex = /:[a-zA-Z0-9_+-]+:/;

		const parts = input.split(emojiPattern).filter(Boolean);

		const tokens = parts.map(p => {
			const isEmoji = emojiRegex.test(p);

			return {
				type: isEmoji ? 'emoji' : 'text',
				value: isEmoji ? getCustomEmoji(p.replace(/:/g, '')) : p
			};
		});

		return tokens.reduce((acc: any[], curr: any) => {
			const last = acc[acc.length - 1];
			if (last && last.type === 'text' && curr.type === 'text') {
				last.value += curr.value;
			} else {
				acc.push(curr);
			}
			return acc;
		}, []);
	}

	const m = parseText(formattedText);

	return (
		<Text
			accessibilityLabel={formattedText}
			style={[styles.text, { color: themes[theme].fontDefault, lineHeight: undefined }, ...style]}
			numberOfLines={numberOfLines}
			testID={testID || `markdown-preview-${formattedText}`}>
			{m.map((token, i) => {
				if (token.type === 'emoji' && token.value) {
					return <CustomEmoji key={i} emoji={token.value} style={{ width: 15, height: 15 }} />;
				}
				return <Text key={i}>{token.value}</Text>;
			})}
		</Text>
	);
};

export default MarkdownPreview;
