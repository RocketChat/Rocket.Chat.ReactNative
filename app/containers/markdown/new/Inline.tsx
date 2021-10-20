import React, { useContext } from 'react';
import { Paragraph as ParagraphProps } from '@rocket.chat/message-parser';

import Hashtag from '../Hashtag';
import AtMention from '../AtMention';
import Link from './Link';
import Plain from './Plain';
import Bold from './Bold';
import Strike from './Strike';
import Italic from './Italic';
import Emoji from './Emoji';
import InlineCode from './InlineCode';
import Image from './Image';
import MarkdownContext from './MarkdownContext';

interface IParagraphProps {
	value: ParagraphProps['value'];
}

const Inline = ({ value }: IParagraphProps): JSX.Element => {
	const { useRealName, username, navToRoomInfo, mentions, channels } = useContext(MarkdownContext);
	return (
		<>
			{value.map(block => {
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
						return <Emoji value={block.value} />;
					case 'MENTION_CHANNEL':
						return <Hashtag hashtag={block.value.value} navToRoomInfo={navToRoomInfo} channels={channels} />;
					case 'INLINE_CODE':
						return <InlineCode value={block.value} />;
					default:
						return null;
				}
			})}
		</>
	);
};

export default Inline;
