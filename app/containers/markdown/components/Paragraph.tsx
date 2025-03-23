import React from 'react';
import { Text } from 'react-native';
import { Paragraph as ParagraphProps } from '@rocket.chat/message-parser';

import Inline from './Inline';
import styles from '../styles';
import { useTheme } from '../../../theme';
import { themes } from '../../../lib/constants';

interface IParagraphProps {
	value: ParagraphProps['value'];
}

const Paragraph = ({ value }: IParagraphProps) => {
	let forceTrim = false;
	const { theme } = useTheme();
	if (
		value?.[0]?.type === 'LINK' &&
		// Need to update the @rocket.chat/message-parser to understand that the label can be a Markup | Markup[]
		// https://github.com/RocketChat/fuselage/blob/461ecf661d9ff4a46390957c915e4352fa942a7c/packages/message-parser/src/definitions.ts#L141
		// @ts-ignore
		(value?.[0]?.value?.label?.value?.toString().trim() === '' || value?.[0]?.value?.label?.[0]?.value?.toString().trim() === '')
	) {
		// We are returning null when we receive a message like this: `[ ](https://open.rocket.chat/)\nplain_text`
		// to avoid render a line empty above the the message
		if (value.length === 1) {
			return null;
		}
		if (value.length === 2 && value?.[1]?.type === 'PLAIN_TEXT' && value?.[1]?.value?.toString().trim() === '') {
			return null;
		}
		forceTrim = true;
	}
	return (
		<Text style={[styles.text, { color: themes[theme].fontDefault }]}>
			<Inline value={value} forceTrim={forceTrim} />
		</Text>
	);
};

export default Paragraph;
