import React from 'react';
import { Text, TextStyle } from 'react-native';

import { themes } from '../../../lib/constants';
import { useTheme } from '../../../theme';
import usePreviewFormatText from '../../../lib/hooks/usePreviewFormatText';
import styles from '../styles';

interface IMarkdownPreview {
	msg?: string;
	numberOfLines?: number;
	testID?: string;
	style?: TextStyle[];
}

const MarkdownPreview = ({ msg, numberOfLines = 1, style = [], testID }: IMarkdownPreview) => {
	const { theme } = useTheme();
	const formattedText = usePreviewFormatText(msg ?? '');

	if (!msg) {
		return null;
	}
	const m = formattedText;
	return (
		<Text
			accessibilityLabel={m}
			style={[styles.text, { color: themes[theme].fontDefault, lineHeight: undefined }, ...style]}
			numberOfLines={numberOfLines}
			testID={testID || `markdown-preview-${m}`}>
			{m}
		</Text>
	);
};

export default MarkdownPreview;
