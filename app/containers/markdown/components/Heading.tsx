import { type ReactElement } from 'react';
import { Text } from 'react-native';
import { type Heading as HeadingProps } from '@rocket.chat/message-parser';

import { themes } from '../../../lib/constants/colors';
import styles from '../styles';
import { useTheme } from '../../../theme';
import { AtMention, Hashtag } from './mentions';
import { Emoji } from './emoji';
import { Bold, Italic, Link, Strike } from './inline/index';
import Plain from './Plain';
import InlineCode from './InlineCode';
import Image from './Image';
import MarkdownContext, { useMarkdownContext } from '../contexts/MarkdownContext';
import Timestamp from './Timestamp';

interface IHeadingProps {
	value: HeadingProps['value'];
	level: HeadingProps['level'];
}

const Heading = ({ value, level }: IHeadingProps): ReactElement => {
	'use memo';

	const { theme } = useTheme();
	const textStyle = styles[`heading${level}`];
	const context = useMarkdownContext({ textStyle });
	const { useRealName, username, navToRoomInfo, mentions, channels } = context;

	return (
		<Text style={[textStyle, { color: themes[theme].fontDefault }]}>
			<MarkdownContext.Provider value={context}>
				{value.map((block, index) => {
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
							return <Emoji block={block} index={index} />;
						case 'MENTION_CHANNEL':
							return <Hashtag hashtag={block.value.value} navToRoomInfo={navToRoomInfo} channels={channels} />;
						case 'INLINE_CODE':
							return <InlineCode value={block.value} />;
						case 'TIMESTAMP':
							return <Timestamp value={block.value} />;
						default:
							return null;
					}
				})}
			</MarkdownContext.Provider>
		</Text>
	);
};

export default Heading;
