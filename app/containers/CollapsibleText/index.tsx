import React, { useState } from 'react';
import { TextStyle, Text, StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';
import { useTheme } from '../../theme';
import I18n from '../../i18n';
import { previewFormatText } from '../../lib/helpers/previewFormatText';

interface ICollapsibleText {
	msg?: string;
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

const CollapsibleText = ({ msg, style = [], linesToTruncate = 1 }: ICollapsibleText) => {
	const [truncatedText, setTruncatedText] = useState('');
	const [showTruncated, setShowTruncated] = useState(true);

	const { colors } = useTheme();

	if (!msg) {
		return null;
	}

	const m = previewFormatText(msg);

	if (truncatedText && showTruncated) {
		return (
			<Text testID={`collapsible-text-truncated-${m}`}>
				<Text accessibilityLabel={truncatedText} style={[styles.text, { color: colors.fontDefault }, ...style]}>
					{`${truncatedText}... `}
				</Text>
				<Text onPress={() => setShowTruncated(false)} style={[styles.textInfo, { color: colors.fontHint }]}>
					{I18n.t('Show_more')}
				</Text>
			</Text>
		);
	}

	return (
		<Text
			accessibilityLabel={m}
			style={[styles.text, { color: colors.fontDefault, height: !showTruncated ? undefined : 0 }, ...style]}
			testID={`collapsible-text-${m}`}
			onTextLayout={event => {
				const { lines } = event.nativeEvent;
				if (lines.length > linesToTruncate) {
					const text = lines
						.splice(0, linesToTruncate)
						.map(line => line.text)
						.join('');
					const truncatedTextLengthWithShowMore = text.length - (4 + I18n.t('Show_more').length);
					const clippedText = text.slice(0, truncatedTextLengthWithShowMore);
					setTruncatedText(clippedText);
				} else {
					setShowTruncated(false);
				}
			}}>
			{m}
			{truncatedText ? (
				<Text
					testID='collapsible-text-show-less'
					onPress={() => setShowTruncated(true)}
					style={[styles.textInfo, { color: colors.fontHint }]}>
					{` ${I18n.t('Show_less')}`}
				</Text>
			) : null}
		</Text>
	);
};

export default CollapsibleText;
