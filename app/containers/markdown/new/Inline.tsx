import React from 'react';
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
import { UserMention } from '../../message/interfaces';

interface IParagraphProps {
	value: ParagraphProps['value'];
	mentions?: UserMention[];
	channels?: {
		name: string;
		_id: number;
	}[];
	getCustomEmoji?: Function;
	navToRoomInfo?: Function;
	baseUrl?: string;
	useRealName?: boolean;
	username?: string;
}

const Inline = ({
	value,
	mentions,
	channels,
	useRealName,
	username,
	getCustomEmoji,
	navToRoomInfo,
	baseUrl
}: IParagraphProps): JSX.Element => (
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
							// @ts-ignore
							useRealName={useRealName}
							// @ts-ignore
							username={username}
							// @ts-ignore
							navToRoomInfo={navToRoomInfo}
							mentions={mentions}
						/>
					);
				case 'EMOJI':
					return <Emoji value={block.value} getCustomEmoji={getCustomEmoji!} baseUrl={baseUrl!} />;
				case 'MENTION_CHANNEL':
					// @ts-ignore
					return <Hashtag hashtag={block.value.value} navToRoomInfo={navToRoomInfo} channels={channels} />;
				case 'INLINE_CODE':
					return <InlineCode value={block.value} />;
				default:
					return null;
			}
		})}
	</>
);

export default Inline;
