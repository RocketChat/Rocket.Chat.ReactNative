import React, { useContext } from 'react';
import { Text } from 'react-native';
import { Paragraph as ParagraphProps } from '@rocket.chat/message-parser';

import Hashtag from '../Hashtag';
import AtMention from '../AtMention';
import styles from '../styles';
import Link from './Link';
import Plain from './Plain';
import Bold from './Bold';
import Strike from './Strike';
import Italic from './Italic';
import Emoji from './Emoji';
import InlineCode from './InlineCode';
import Image from './Image';
import MarkdownContext from './MarkdownContext';
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
						block.value.label.value =
							// Need to update the @rocket.chat/message-parser to understand that the label can be a Markup | Markup[]
							// https://github.com/RocketChat/fuselage/blob/461ecf661d9ff4a46390957c915e4352fa942a7c/packages/message-parser/src/definitions.ts#L141
							// @ts-ignore
							block.value?.label?.value?.toString().trimLeft() || block?.value?.label?.[0]?.value?.toString().trimLeft();
					}
					if (index === 1 && block.type !== 'LINK') {
						block.value = block.value?.toString().trimLeft();
					}
				}

				switch (block.type) {
					case 'IMAGE':
						return <Image value={block.value} />;
					case 'PLAIN_TEXT':
						return <Plain value={block.value} />;
					case 'BOLD':
						return <Bold value={block.value} />;
					case 'STRIKE':
						return <Strike value={block.value} />;
					case 'ITALIC':
						return <Italic value={block.value} />;
					case 'LINK':
						return <Link value={block.value} />;
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
					case 'EMOJI':
						return <Emoji block={block} />;
					case 'MENTION_CHANNEL':
						return <Hashtag hashtag={block.value.value} navToRoomInfo={navToRoomInfo} channels={channels} />;
					case 'INLINE_CODE':
						return <InlineCode value={block.value} />;
					case 'INLINE_KATEX':
						// return <InlineKaTeX value={block.value} />;
						return <Text>{block.value}</Text>;
					default:
						return null;
				}
			})}
		</Text>
	);
};

export default Inline;
