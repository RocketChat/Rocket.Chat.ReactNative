import { Paragraph as ParagraphProps } from '@rocket.chat/message-parser';
import React, { useContext } from 'react';
import { Text } from 'react-native';

import AtMention from '../AtMention';
import Hashtag from '../Hashtag';
import styles from '../styles';
import Bold from './Bold';
import Emoji from './Emoji';
import Image from './Image';
import InlineCode from './InlineCode';
import Italic from './Italic';
import Link from './Link';
import MarkdownContext from './MarkdownContext';
import Plain from './Plain';
import Strike from './Strike';
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

				const key = `${block.type}-${index}`;

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
						return <Emoji key={key} block={block} />;
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
