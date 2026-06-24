import { useState } from 'react';
import { type TextStyle, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import sharedStyles from '../../views/Styles';
import I18n from '../../i18n';
import usePreviewFormatText from '../../lib/hooks/usePreviewFormatText';

interface ICollapsibleText {
	msg?: string;
	style?: TextStyle[];
	linesToTruncate?: number;
}

const styles = StyleSheet.create(theme => ({
	text: {
		fontSize: 16,
		...sharedStyles.textRegular,
		textAlignVertical: 'center',
		color: theme.colors.fontDefault
	},
	textInfo: {
		fontSize: 14,
		...sharedStyles.textRegular,
		color: theme.colors.fontHint
	}
}));

const CollapsibleText = ({ msg, style = [], linesToTruncate = 1 }: ICollapsibleText) => {
	const [truncatedText, setTruncatedText] = useState('');
	const [showTruncated, setShowTruncated] = useState(true);

	const formattedText = usePreviewFormatText(msg ?? '');

	if (!msg) {
		return null;
	}

	const m = formattedText;

	if (truncatedText && showTruncated) {
		return (
			<Text testID={`collapsible-text-truncated-${m}`}>
				<Text accessibilityLabel={truncatedText} style={[styles.text, ...style]}>
					{`${truncatedText}... `}
				</Text>
				<Text onPress={() => setShowTruncated(false)} style={styles.textInfo}>
					{I18n.t('Show_more')}
				</Text>
			</Text>
		);
	}

	return (
		<Text
			accessibilityLabel={m}
			style={[styles.text, { height: !showTruncated ? undefined : 0 }, ...style]}
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
				<Text testID='collapsible-text-show-less' onPress={() => setShowTruncated(true)} style={styles.textInfo}>
					{` ${I18n.t('Show_less')}`}
				</Text>
			) : null}
		</Text>
	);
};

export default CollapsibleText;
