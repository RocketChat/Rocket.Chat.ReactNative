import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Italic as ItalicProps } from '@rocket.chat/message-parser';

import Strike from './Strike';
import Bold from './Bold';
import Plain from './Plain';
import Link from './Link';

interface IItalicProps {
	value: ItalicProps['value'];
}

const styles = StyleSheet.create({
	text: {
		fontStyle: 'italic'
	}
});

const Italic = ({ value }: IItalicProps): JSX.Element => (
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
				default:
					return null;
			}
		})}
	</Text>
);

export default Italic;
