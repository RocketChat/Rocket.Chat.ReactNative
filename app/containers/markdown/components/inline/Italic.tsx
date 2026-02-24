import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { type Italic as ItalicProps } from '@rocket.chat/message-parser';

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

type TItalicWithID<T> = T & { _id: string };

const Italic = ({ value }: IItalicProps) => (
	<Text style={styles.text}>
		{value.map(b => {
			const block = b as TItalicWithID<typeof b>;
			switch (block.type) {
				case 'LINK':
					return <Link key={block._id} value={block.value} />;
				case 'PLAIN_TEXT':
					return <Plain key={block._id} value={block.value} />;
				case 'STRIKE':
					return <Strike key={block._id} value={block.value} />;
				case 'BOLD':
					return <Bold key={block._id} value={block.value} />;
				case 'MENTION_CHANNEL':
					return <Plain key={block._id} value={`#${block.value.value}`} />;
				default:
					return null;
			}
		})}
	</Text>
);

export default Italic;
