import React from 'react';
import { Text, TextStyle } from 'react-native';
import removeMarkdown from 'remove-markdown';

import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import { themes } from '../../lib/constants';
import { formatText } from './formatText';
import { useTheme } from '../../theme';
import styles from './styles';
import { formatHyperlink } from './formatHyperlink';

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

	let m = formatText(msg);
	m = formatHyperlink(m);
	m = shortnameToUnicode(m);
	// Removes sequential empty spaces
	m = m.replace(/\s+/g, ' ');
	m = removeMarkdown(m);
	m = m.replace(/\n+/g, ' ');
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
