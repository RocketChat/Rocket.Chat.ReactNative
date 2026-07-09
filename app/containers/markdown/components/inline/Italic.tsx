import { useContext } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { type Italic as ItalicProps } from '@rocket.chat/message-parser';

import { Bold, Link, Strike } from './index';
import Plain from '../Plain';
import { AtMention, Hashtag } from '../mentions';
import MarkdownContext, { useMarkdownContext } from '../../contexts/MarkdownContext';

interface IItalicProps {
	value: ItalicProps['value'];
}

const styles = StyleSheet.create({
	text: {
		fontStyle: 'italic'
	},
	boldItalic: {
		...Platform.select({
			ios: {
				fontStyle: 'italic'
			},
			android: {
				fontStyle: 'italic',
				fontWeight: '700'
			}
		})
	},
	semiboldItalic: {
		...Platform.select({
			ios: {
				fontStyle: 'italic'
			},
			android: {
				fontFamily: 'Inter-SemiBoldItalic',
				fontStyle: 'normal',
				fontWeight: 'normal'
			}
		})
	}
});

function getStyle(heading: number | undefined, bold: boolean | undefined) {
	if ((heading && heading < 3) || bold) {
		return styles.boldItalic;
	}
	if (heading && heading < 5) {
		return styles.semiboldItalic;
	}
	return styles.text;
}

const Italic = ({ value }: IItalicProps) => {
	'use memo';

	const { heading, bold } = useContext(MarkdownContext);
	const context = useMarkdownContext({ textStyle: getStyle(heading, bold) });

	return (
		<Text>
			<MarkdownContext.Provider value={context}>
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
							return <Hashtag hashtag={block.value.value} />;
						case 'MENTION_USER':
							return <AtMention mention={block.value.value} />;
						default:
							return null;
					}
				})}
			</MarkdownContext.Provider>
		</Text>
	);
};

export default Italic;
