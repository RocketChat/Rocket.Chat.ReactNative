import React from 'react';
import { Text } from 'react-native';
import type { Inlines } from '@rocket.chat/message-parser';

import { AtMention, Hashtag } from './mentions';
import { Emoji } from './emoji';
import { Bold, Italic, Link, Strike } from './inline/index';
import Plain from './Plain';
import InlineCode from './InlineCode';
import Image from './Image';
import type { IUserMention, IUserChannel } from '../interfaces';

type InlineProps = {
	block: Inlines;
	useRealName: boolean | undefined;
	username: string | undefined;
	navToRoomInfo: Function | undefined;
	mentions: IUserMention[] | undefined;
	channels: IUserChannel[] | undefined;
	onHeightChange?: (height: number) => void;
};

const Inline = (props: InlineProps) => {
	switch (props.block.type) {
		case 'IMAGE':
			return <Image value={props.block.value} onHeightChange={props.onHeightChange} />;
		case 'PLAIN_TEXT':
			return <Plain value={props.block.value} />;
		case 'BOLD':
			return <Bold value={props.block.value} />;
		case 'STRIKE':
			return <Strike value={props.block.value} />;
		case 'ITALIC':
			return <Italic value={props.block.value} />;
		case 'LINK':
			return <Link value={props.block.value} />;
		case 'MENTION_USER':
			return (
				<AtMention
					mention={props.block.value.value}
					useRealName={props.useRealName}
					username={props.username}
					navToRoomInfo={props.navToRoomInfo}
					mentions={props.mentions}
				/>
			);
		case 'EMOJI':
			return <Emoji block={props.block} />;
		case 'MENTION_CHANNEL':
			return <Hashtag hashtag={props.block.value.value} navToRoomInfo={props.navToRoomInfo} channels={props.channels} />;
		case 'INLINE_CODE':
			return <InlineCode value={props.block.value} />;
		case 'INLINE_KATEX':
			return <Text>{props.block.value}</Text>;
		default:
			return null;
	}
};

export default Inline;
