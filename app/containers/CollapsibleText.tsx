import React, { useState } from 'react';
import { TextStyle, Text, StyleSheet } from 'react-native';

import sharedStyles from '../views/Styles';
import { useTheme } from '../theme';
import { previewFormatText } from './markdown/previewFormatText';
import I18n from '../i18n';

interface ICollapsibleText {
	msg?: string;
	testID?: string;
	style?: TextStyle[];
	linesToTruncate?: number;
}

const styles = StyleSheet.create({
	text: {
		fontSize: 16,
		...sharedStyles.textRegular,
		textAlignVertical: 'center'
	},
	textInfo: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

const CollapsibleText = ({ msg, style = [], testID, linesToTruncate = 1 }: ICollapsibleText) => {
	const [truncatedText, setTruncatedText] = useState('');
	const [showTruncated, setShowTruncated] = useState(true);

	const { colors } = useTheme();

	if (!msg) {
		return null;
	}

	const m = previewFormatText(msg);

	if (truncatedText && showTruncated) {
		return (
			<Text accessibilityLabel={truncatedText} style={[styles.text, { color: colors.bodyText }, ...style]}>
				{`${truncatedText}... `}
				<Text onPress={() => setShowTruncated(false)} style={[styles.textInfo, { color: colors.fontInfo }]}>
					{I18n.t('Show_more')}
				</Text>
			</Text>
		);
	}

	return (
		<Text
			accessibilityLabel={m}
			style={[styles.text, { color: colors.bodyText, height: !showTruncated ? undefined : 0 }, ...style]}
			testID={testID || `markdown-preview-${m}`}
			onTextLayout={event => {
				// get all lines
				const { lines } = event.nativeEvent;
				if (lines.length > linesToTruncate) {
					const text = lines
						.splice(0, linesToTruncate)
						.map(line => line.text)
						.join('');
					// 12 is equal the
					const truncatedTextLengthWithShowMore = text.length - (4 + I18n.t('Show_more').length);
					const clippedText = text.slice(0, truncatedTextLengthWithShowMore);
					setTruncatedText(clippedText);
				} else {
					setShowTruncated(false);
				}
			}}
		>
			{m}
			{truncatedText ? (
				<Text onPress={() => setShowTruncated(true)} style={[styles.textInfo, { color: colors.fontInfo }]}>
					{` ${I18n.t('Show_less')}`}
				</Text>
			) : null}
		</Text>
	);
};

export default CollapsibleText;
