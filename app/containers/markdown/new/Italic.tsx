import React, { useContext } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Italic as ItalicProps } from '@rocket.chat/message-parser';

import Strike from './Strike';
import Bold from './Bold';
import Plain from './Plain';
import Link from './Link';
import MarkdownContext from './MarkdownContext';
import AtMention from '../AtMention';

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
			const { useRealName, username, navToRoomInfo, mentions} = useContext(MarkdownContext);
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

export default Italic;
