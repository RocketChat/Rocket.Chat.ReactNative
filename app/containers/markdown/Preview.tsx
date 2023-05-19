import React from 'react';
import { Text, TextStyle } from 'react-native';

import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import styles from './styles';
import { previewFormatText } from './previewFormatText';

interface IMarkdownPreview {
	msg?: string;
	numberOfLines?: number;
	testID?: string;
	style?: TextStyle[];
}

const MarkdownPreview = ({ msg, numberOfLines = 1, testID, style = [] }: IMarkdownPreview) => {
	const { theme } = useTheme();

	if (!msg) {
		return null;
	}

	const m = previewFormatText(msg);
	return (
		<Text
			accessibilityLabel={m}
			style={[styles.text, { color: themes[theme].bodyText }, ...style]}
			numberOfLines={numberOfLines}
			testID={testID}
		>
			{m}
		</Text>
	);
};

export default MarkdownPreview;
