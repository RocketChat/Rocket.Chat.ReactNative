import React, { useContext } from 'react';
import { StyleSheet, Text } from 'react-native';
import { type Italic as ItalicProps } from '@rocket.chat/message-parser';

import { Bold, Link, Strike } from './index';
import Plain from '../Plain';
import AtMention from '../mentions/AtMention';
import MarkdownContext from '../../contexts/MarkdownContext';
import Hashtag from '../mentions/Hashtag';

interface IItalicProps {
	value: ItalicProps['value'];
}

const styles = StyleSheet.create({
	text: {
		fontStyle: 'italic'
	}
});

const Italic = ({ value }: IItalicProps) => {
	const { useRealName, username, navToRoomInfo, mentions, channels } = useContext(MarkdownContext);

	return (
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
						return (
							<Hashtag
								hashtag={block.value.value}
								channels={channels}
								navToRoomInfo={navToRoomInfo}
							/>
						);
					case 'MENTION_USER':
						return (
							<AtMention
								mention={block.value.value}
								username={username}
								navToRoomInfo={navToRoomInfo}
								useRealName={useRealName}
								mentions={mentions}
							/>
						);
					default:
						return null;
				}
			})}
		</Text>
	);
};

export default Italic;
