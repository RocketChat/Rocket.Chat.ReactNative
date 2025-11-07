import React, { useContext } from 'react';
import { Text } from 'react-native';
import { type Paragraph as ParagraphProps } from '@rocket.chat/message-parser';

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

				const getBlockValueString = (v: any): string => {
					if (!v) return 'null';
					if (typeof v === 'string') return v;
					if (typeof v?.value === 'string') return v.value;
					if (Array.isArray(v)) return v.map(getBlockValueString).join('');
					return JSON.stringify(v).slice(0, 20);
				};

				// key example: IMAGE-https:rocket.chat/assets/image...-3 <upto 20 chars only>
				const key = `${block.type}-${getBlockValueString(block.value)}-${index}`;

				switch (block.type) {
					case 'IMAGE':
						return <Image key={key} value={block.value} />;
					case 'PLAIN_TEXT':
						return <Plain key={key} value={block.value} />;
					case 'BOLD':
						return <Bold key={key} value={block.value} />;
					case 'STRIKE':
						return <Strike key={key} value={block.value} />;
					case 'ITALIC':
						return <Italic key={key} value={block.value} />;
					case 'LINK':
						return <Link key={key} value={block.value} />;
					case 'MENTION_USER':
						return (
							<AtMention
								key={key}
								mention={block.value.value}
								useRealName={useRealName}
								username={username}
								navToRoomInfo={navToRoomInfo}
								mentions={mentions}
							/>
						);
					case 'EMOJI':
						return <Emoji key={key} block={block} index={index} />;
					case 'MENTION_CHANNEL':
						return <Hashtag key={key} hashtag={block.value.value} navToRoomInfo={navToRoomInfo} channels={channels} />;
					case 'INLINE_CODE':
						return <InlineCode key={key} value={block.value} />;
					case 'INLINE_KATEX':
						// return <InlineKaTeX value={block.value} />;
						return <Text key={key}>{block.value}</Text>;
					default:
						return null;
				}
			})}
		</Text>
	);
};

export default Inline;
