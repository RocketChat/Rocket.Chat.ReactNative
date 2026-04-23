import React from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { type Italic as ItalicProps } from '@rocket.chat/message-parser';

import { Bold, Link, Strike } from './index';
import Plain from '../Plain';

interface IItalicProps {
	value: ItalicProps['value'];
	style?: TextStyle;
}

const styles = StyleSheet.create({
	text: {
		fontStyle: 'italic'
	}
});

const Italic = ({ value, style }: IItalicProps) => (
	<Text style={[styles.text, style]}>
		{value.map(block => {
			switch (block.type) {
				case 'LINK':
					return <Link value={block.value} style={style} />;
				case 'PLAIN_TEXT':
					return <Plain value={block.value} style={style} />;
				case 'STRIKE':
					return <Strike value={block.value} style={style} />;
				case 'BOLD':
					return <Bold value={block.value} style={style} />;
				case 'MENTION_CHANNEL':
					return <Plain value={`#${block.value.value}`} style={style} />;
				default:
					return null;
			}
		})}
	</Text>
);

export default Italic;
