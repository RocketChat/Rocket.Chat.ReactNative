import React, { useContext } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Bold as BoldProps } from '@rocket.chat/message-parser';

import sharedStyles from '../../../views/Styles';
import Strike from './Strike';
import Italic from './Italic';
import Plain from './Plain';
import Link from './Link';
import AtMention from '../AtMention';
import MarkdownContext from './MarkdownContext';

interface IBoldProps {
	value: BoldProps['value'];
}

const styles = StyleSheet.create({
	text: {
		...sharedStyles.textBold
	}
});

const Bold = ({ value }: IBoldProps) => (
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

export default Bold;
