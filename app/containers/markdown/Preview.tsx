import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import removeMarkdown from 'remove-markdown';

import shortnameToUnicode from '../../utils/shortnameToUnicode';
import { themes } from '../../constants/colors';
import { formatText } from './formatText';
import styles from './styles';

interface IMarkdownPreview {
	msg: string;
	numberOfLines?: number;
	theme: string;
	testID?: string;
	style?: StyleProp<TextStyle>[];
}

const MarkdownPreview = ({ msg, numberOfLines = 1, testID, theme, style = [] }: IMarkdownPreview): React.ReactElement | null => {
	if (!msg) {
		return null;
	}

	let m = formatText(msg);

	// Ex: '[ ](https://open.rocket.chat/group/test?msg=abcdef)  Test'
	// Return: 'Test'
	m = m.replace(/^\[([\s]*)\]\(([^)]*)\)\s/, '').trim();
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
			testID={testID}>
			{m}
		</Text>
	);
};

export default MarkdownPreview;
