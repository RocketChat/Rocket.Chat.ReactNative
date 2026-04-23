import React, { useContext, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { type Spoiler as SpoilerProps } from '@rocket.chat/message-parser';

import { Bold, Italic, Link, Strike } from './index';
import Plain from '../Plain';
import InlineCode from '../InlineCode';
import Image from '../Image';
import MarkdownContext from '../../contexts/MarkdownContext';
import Timestamp from '../Timestamp';
import { AtMention, Hashtag } from '../mentions';
import { Emoji } from '../emoji';
import sharedStyles from '../../../../views/Styles';

interface ISpoilerProps {
	value: SpoilerProps['value'];
}

const styles = StyleSheet.create({
	spoiler: {
		borderRadius: 2,
		paddingHorizontal: 2
	},
	spoilerText: {
		...sharedStyles.textRegular
	},
	hidden: {
		backgroundColor: '#000',
		color: '#000'
	}
});

const Spoiler = ({ value }: ISpoilerProps) => {
	const [isRevealed, setIsRevealed] = useState(false);
	const { useRealName, username, navToRoomInfo, mentions, channels } = useContext(MarkdownContext);

	const handleToggle = () => {
		setIsRevealed(!isRevealed);
	};

	return (
		<Text
			style={styles.spoilerText}
			onPress={handleToggle}
		>
			{value.map((block, index) => {
				switch (block.type) {
					case 'PLAIN_TEXT':
						return <Plain key={index} value={block.value} style={isRevealed ? undefined : styles.hidden}/>;
					case 'BOLD':
						return <Bold key={index} value={block.value} style={isRevealed ? undefined : styles.hidden}/>;
					case 'ITALIC':
						return <Italic key={index} value={block.value} style={isRevealed ? undefined : styles.hidden}/>;
					case 'STRIKE':
						return <Strike key={index} value={block.value} style={isRevealed ? undefined : styles.hidden}/>;
					case 'LINK':
						return <Link key={index} value={block.value} style={isRevealed ? undefined : styles.hidden} disabled={!isRevealed}/>;
					case 'INLINE_CODE':
						return <InlineCode key={index} value={block.value} style={isRevealed ? undefined : styles.hidden}/>;
					case 'IMAGE':
						return <Image key={index} value={block.value} />;
					case 'TIMESTAMP':
						return <Timestamp key={index} value={block.value} />;
					case 'MENTION_USER':
						return (
							<AtMention
								key={index}
								mention={block.value.value}
								useRealName={useRealName}
								username={username}
								navToRoomInfo={navToRoomInfo}
								mentions={mentions}
								style={isRevealed ? [] : [styles.hidden]}
								disabled={!isRevealed}
							/>
						);
					case 'MENTION_CHANNEL':
						return (
							<Hashtag
								key={index}
								hashtag={block.value.value}
								navToRoomInfo={navToRoomInfo}
								channels={channels}
								style={isRevealed ? [] : [styles.hidden]}
								disabled={!isRevealed}
							/>
						);
					case 'EMOJI':
						return <Emoji key={index} block={block} index={index} />;
					case 'INLINE_KATEX':
						return <Text key={index}>{block.value}</Text>;
					default:
						return null;
				}
			})}
		</Text>
	);
};

export default Spoiler;
