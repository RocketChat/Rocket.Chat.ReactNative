import React, { useContext } from 'react';
import { Text } from 'react-native';
import type { Paragraph as ParagraphProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { AtMention, Hashtag } from './mentions';
import { Emoji } from './emoji';
import { Bold, Italic, Link, Strike } from './inline/index';
import Plain from './Plain';
import InlineCode from './InlineCode';
import Image from './Image';
import MarkdownContext from '../contexts/MarkdownContext';
// import { InlineKaTeX, KaTeX } from './Katex';

interface IParagraphProps {
	value: ParagraphProps['value'];
	forceTrim?: boolean;
}

const Inline = ({ value, forceTrim }: IParagraphProps): React.ReactElement | null => {
	const { useRealName, username, navToRoomInfo, mentions, channels } = useContext(MarkdownContext);
	return (
		<Text style={styles.inline}>
			{value.map((block, index) => {
				// We are forcing trim when is a `[ ](https://https://open.rocket.chat/) plain_text`
				// to clean the empty spaces
				if (forceTrim) {
					if (index === 0 && block.type === 'LINK') {
						if (!Array.isArray(block.value.label)) {
							block.value.label.value = block.value?.label?.value?.toString().trimLeft();
						} else {
							// @ts-ignore - we are forcing the value to be a string
							block.value.label.value = block?.value?.label?.[0]?.value?.toString().trimLeft();
						}
					}
					if (index === 1 && block.type !== 'LINK') {
						block.value = block.value?.toString().trimLeft();
					}
				}

				switch (block.type) {
					case 'IMAGE':
						return <Image key={index} value={block.value} />;
					case 'PLAIN_TEXT':
						return <Plain key={index} value={block.value} />;
					case 'BOLD':
						return <Bold key={index} value={block.value} />;
					case 'STRIKE':
						return <Strike key={index} value={block.value} />;
					case 'ITALIC':
						return <Italic key={index} value={block.value} />;
					case 'LINK':
						return <Link key={index} value={block.value} />;
					case 'MENTION_USER':
						return (
							<AtMention
								key={index}
								mention={block.value.value}
								useRealName={useRealName}
								username={username}
								navToRoomInfo={navToRoomInfo}
								mentions={mentions}
							/>
						);
					case 'EMOJI':
						return <Emoji key={index} block={block} />;
					case 'MENTION_CHANNEL':
						return <Hashtag key={index} hashtag={block.value.value} navToRoomInfo={navToRoomInfo} channels={channels} />;
					case 'INLINE_CODE':
						return <InlineCode key={index} value={block.value} />;
					case 'INLINE_KATEX':
						// return <InlineKaTeX value={block.value} />;
						return <Text key={index}>{block.value}</Text>;
					default:
						return null;
				}
			})}
		</Text>
	);
};

export default Inline;
