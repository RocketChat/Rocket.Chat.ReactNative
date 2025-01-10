import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Italic as ItalicProps } from '@rocket.chat/message-parser';

import { Bold, Link, Strike } from './index';
import Plain from '../Plain';

interface IItalicProps {
	value: ItalicProps['value'];
}

const styles = StyleSheet.create({
	text: {
		fontStyle: 'italic'
	}
});

const Italic = ({ value }: IItalicProps) => (
	<Text style={styles.text}>
		{value.map(block => {
			switch (block.type) {
				case 'LINK':
					return <Link value={block.value} />;
				case 'PLAIN_TEXT':
					return <Plain value={block.value} />;
				case 'STRIKE':
					return <Strike value={block.value} />;
				case 'BOLD':
					return <Bold value={block.value} />;
				case 'MENTION_CHANNEL':
					return <Plain value={`#${block.value.value}`} />;
				default:
					return null;
			}
		})}
	</Text>
);

export default Italic;
