import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Paragraph as ParagraphProps } from '@rocket.chat/message-parser';

import Inline from './Inline';

interface IUser {
	_id: string;
	username: string;
	name: string;
}

type UserMention = Pick<IUser, '_id' | 'username' | 'name'>;

interface IParagraphProps {
	value: ParagraphProps['value'];
	mentions: UserMention[];
	channels: {
		name: string;
		_id: number;
	}[];
	navToRoomInfo: Function;
	style: StyleProp<ViewStyle>;
}

const Paragraph: React.FC<IParagraphProps> = ({ value, mentions, channels, navToRoomInfo, style }) => (
	<Inline value={value} mentions={mentions} channels={channels} navToRoomInfo={navToRoomInfo} style={style} />
);

export default Paragraph;
