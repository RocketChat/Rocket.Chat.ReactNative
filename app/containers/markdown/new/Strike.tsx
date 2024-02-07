import { Strike as StrikeProps } from '@rocket.chat/message-parser';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import Bold from './Bold';
import Italic from './Italic';
import Link from './Link';
import Plain from './Plain';

interface IStrikeProps {
	value: StrikeProps['value'];
}

const styles = StyleSheet.create({
	text: {
		textDecorationLine: 'line-through'
	}
});

const Strike = ({ value }: IStrikeProps) => (
	<Text style={styles.text}>
		{value.map((block, index) => {
			const key = `${block.type}-${index}`;
			switch (block.type) {
				case 'LINK':
					return <Link key={key} value={block.value} />;
				case 'PLAIN_TEXT':
					return <Plain key={key} value={block.value} />;
				case 'BOLD':
					return <Bold key={key} value={block.value} />;
				case 'ITALIC':
					return <Italic key={key} value={block.value} />;
				case 'MENTION_CHANNEL':
					return <Plain key={key} value={`#${block.value.value}`} />;
				default:
					return null;
			}
		})}
	</Text>
);

export default Strike;
