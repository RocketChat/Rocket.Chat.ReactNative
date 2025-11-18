import React, { useContext } from 'react';
import { Text } from 'react-native';
import { type Plain as PlainProps } from '@rocket.chat/message-parser';

import { useTheme } from '../../../theme';
import styles from '../styles';
import MarkdownContext from '../contexts/MarkdownContext';

interface IPlainProps {
	value: PlainProps['value'];
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const Plain = ({ value }: IPlainProps): React.ReactElement => {
	const { colors } = useTheme();
	const { highlights = [] } = useContext<any>(MarkdownContext);

	const text = (value ?? '').toString();

	if (!highlights || !highlights.length) {
		return (
			<Text accessibilityLabel={text} style={[styles.plainText, { color: colors.fontDefault }]}>
				{text}
			</Text>
		);
	}

	// prepare case-insensitive set of highlight words
	const words = highlights.map((w: any) => w?.toString().trim()).filter(Boolean);
	if (!words.length) {
		return (
			<Text accessibilityLabel={text} style={[styles.plainText, { color: colors.fontDefault }]}>
				{text}
			</Text>
		);
	}

	const wordsLower = new Set(words.map((w: string) => w.toLowerCase()));
	// build regex to split and keep matched parts; guard pattern
	const pattern = words.map(escapeRegExp).filter(Boolean).join('|');
	if (!pattern) {
		return (
			<Text accessibilityLabel={text} style={[styles.plainText, { color: colors.fontDefault }]}>
				{text}
			</Text>
		);
	}
	const re = new RegExp(`(${pattern})`, 'ig');
	const parts = text.split(re);

	// use red highlight for matched words (theme-aware tokens)
	const bg = colors.statusBackgroundDanger ?? '#FFC1C9';
	const matchTextColor = colors.statusFontDanger ?? colors.fontDefault;

	return (
		<Text accessibilityLabel={text} style={[styles.plainText, { color: colors.fontDefault }]}> 
			{parts.map((part, i) => {
				if (!part) return null;
				const isMatch = wordsLower.has(part.toLowerCase());
				if (isMatch) {
					return (
						<Text key={`h-${i}`} style={{ backgroundColor: bg, color: matchTextColor }}>
							{part}
						</Text>
					);
				}
				return <Text key={`p-${i}`}>{part}</Text>;
			})}
		</Text>
	);
};

export default Plain;
