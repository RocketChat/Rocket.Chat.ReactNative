import { type ReactElement } from 'react';
import { Text } from 'react-native';
import { type Link as LinkProps, type Paragraph as ParagraphProps } from '@rocket.chat/message-parser';

import styles from '../styles';
import { AtMention, Hashtag } from './mentions';
import { Emoji } from './emoji';
import { Bold, Italic, Link, Strike } from './inline/index';
import Plain from './Plain';
import InlineCode from './InlineCode';
import Image from './Image';
import Timestamp from './Timestamp';
// import { InlineKaTeX, KaTeX } from './Katex';

interface IParagraphProps {
	value: ParagraphProps['value'];
	forceTrim?: boolean;
}

const getInlineKey = (block: ParagraphProps['value'][number], index: number): string => `${block.type}-${index}`;

const toLinkLabelValue = (label: LinkProps['value']['label']): ParagraphProps['value'] =>
	Array.isArray(label) ? label : [label];

const Inline = ({ value, forceTrim }: IParagraphProps): ReactElement | null => {
	return (
		<Text style={styles.inline}>
			{value.map((block, index) => {
				const key = getInlineKey(block, index);

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
						return <Image key={key} value={block.value} />;
					case 'PLAIN_TEXT':
						return <Plain key={key} value={block.value} />;
					case 'BOLD':
						return (
							<Bold key={key}>
								<Inline value={block.value} />
							</Bold>
						);
					case 'STRIKE':
						return (
							<Strike key={key}>
								<Inline value={block.value} />
							</Strike>
						);
					case 'ITALIC':
						return (
							<Italic key={key}>
								<Inline value={block.value} />
							</Italic>
						);
					case 'LINK':
						return (
							<Link key={key} value={block.value}>
								<Inline value={toLinkLabelValue(block.value.label)} />
							</Link>
						);
					case 'MENTION_USER':
						return <AtMention key={key} mention={block.value.value} />;
					case 'EMOJI':
						return <Emoji key={key} block={block} index={index} />;
					case 'MENTION_CHANNEL':
						return <Hashtag key={key} hashtag={block.value.value} />;
					case 'INLINE_CODE':
						return <InlineCode key={key} value={block.value} />;
					case 'INLINE_KATEX':
						// return <InlineKaTeX value={block.value} />;
						return <Text key={key}>{block.value}</Text>;
					case 'TIMESTAMP':
						return <Timestamp key={key} value={block.value} />;
					default:
						return null;
				}
			})}
		</Text>
	);
};

export default Inline;
