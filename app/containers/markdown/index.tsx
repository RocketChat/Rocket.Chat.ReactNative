import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { MarkdownAST, parse } from '@rocket.chat/message-parser';

import { IUserMention, IUserChannel, TOnLinkPress } from './interfaces';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { TSupportedThemes } from '../../theme';
import Body from './components';

export { default as MarkdownPreview } from './Preview';

interface IMarkdownProps {
	msg?: string | null;
	theme?: TSupportedThemes;
	md?: MarkdownAST;
	mentions?: IUserMention[];
	getCustomEmoji?: TGetCustomEmoji;
	username?: string;
	tmid?: string;
	numberOfLines?: number;
	customEmojis?: boolean;
	useRealName?: boolean;
	channels?: IUserChannel[];
	enableMessageParser?: boolean;
	// TODO: Refactor when migrate Room
	navToRoomInfo?: Function;
	testID?: string;
	style?: StyleProp<TextStyle>[];
	onLinkPress?: TOnLinkPress;
	isTranslated?: boolean;
}

const Markdown: React.FC<IMarkdownProps> = ({
	msg,
	md,
	mentions,
	channels,
	navToRoomInfo,
	useRealName,
	username = '',
	getCustomEmoji,
	onLinkPress,
	isTranslated
}: IMarkdownProps) => {
	if (!msg) {
		return null;
	}
	if (!isTranslated) {
		const tokens = md ?? parse(msg);
		return (
			<Body
				username={username}
				getCustomEmoji={getCustomEmoji}
				useRealName={useRealName}
				tokens={tokens}
				mentions={mentions}
				channels={channels}
				navToRoomInfo={navToRoomInfo}
				onLinkPress={onLinkPress}
			/>
		);
	}
	return null;
};

export default Markdown;
