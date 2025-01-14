import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Strike as StrikeProps } from '@rocket.chat/message-parser';


import { Bold, Italic, Link} from './index';
import Plain from '../Plain';

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
		{value.map(block => {
			switch (block.type) {
				case 'LINK':
					return <Link value={block.value} />;
				case 'PLAIN_TEXT':
					return <Plain value={block.value} />;
				case 'BOLD':
					return <Bold value={block.value} />;
				case 'ITALIC':
					return <Italic value={block.value} />;
				case 'MENTION_CHANNEL':
					return <Plain value={`#${block.value.value}`} />;
				default:
					return null;
			}
		})}
	</Text>
);

export default Strike;
