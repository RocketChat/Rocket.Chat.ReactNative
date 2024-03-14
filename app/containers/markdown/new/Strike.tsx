import React, { useContext } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Strike as StrikeProps } from '@rocket.chat/message-parser';

import Bold from './Bold';
import Italic from './Italic';
import Plain from './Plain';
import Link from './Link';
import AtMention from '../AtMention';
import MarkdownContext from './MarkdownContext';

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
			const { useRealName, username, navToRoomInfo, mentions} = useContext(MarkdownContext);
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
				case 'MENTION_USER':
					return (
						<AtMention
							mention={block.value.value}
							useRealName={useRealName}
							username={username}
							navToRoomInfo={navToRoomInfo}
							mentions={mentions}
						/>
					);
				default:
					return null;
			}
		})}
	</Text>
);

export default Strike;
