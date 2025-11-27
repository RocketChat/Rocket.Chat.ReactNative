import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { type Strike as StrikeProps } from '@rocket.chat/message-parser';

import { Bold, Italic, Link } from './index';
import Plain from '../Plain';

interface IStrikeProps {
	value: StrikeProps['value'];
}

const styles = StyleSheet.create({
	text: {
		textDecorationLine: 'line-through'
	}
});

type TStrikeWithID<T> = T & { _id: string };

const Strike = ({ value }: IStrikeProps) => (
	<Text style={styles.text}>
		{value.map(b => {
			const block = b as TStrikeWithID<typeof b>;
			switch (block.type) {
				case 'LINK':
					return <Link key={block._id} value={block.value} />;
				case 'PLAIN_TEXT':
					return <Plain key={block._id} value={block.value} />;
				case 'BOLD':
					return <Bold key={block._id} value={block.value} />;
				case 'ITALIC':
					return <Italic key={block._id} value={block.value} />;
				case 'MENTION_CHANNEL':
					return <Plain key={block._id} value={`#${block.value.value}`} />;
				default:
					return null;
			}
		})}
	</Text>
);

export default Strike;
