import { Italic as ItalicProps } from '@rocket.chat/message-parser';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import Bold from './Bold';
import Link from './Link';
import Plain from './Plain';
import Strike from './Strike';

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
		{value.map((block, index) => {
			const key = `${block.type}-${index}`;
			switch (block.type) {
				case 'LINK':
					return <Link key={key} value={block.value} />;
				case 'PLAIN_TEXT':
					return <Plain key={key} value={block.value} />;
				case 'STRIKE':
					return <Strike key={key} value={block.value} />;
				case 'BOLD':
					return <Bold key={key} value={block.value} />;
				case 'MENTION_CHANNEL':
					return <Plain key={key} value={`#${block.value.value}`} />;
				default:
					return null;
			}
		})}
	</Text>
);

export default Italic;
