import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { MarkdownAST } from '@rocket.chat/message-parser';

import NewMarkdown from './new';
import { IUserMention, IUserChannel, TOnLinkPress } from './interfaces';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { TSupportedThemes } from '../../theme';

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

//	to fix the debug issue on @rocket.chat/message-parser we need to update the archive messageParser.js:
//	if (process.env.NODE_ENV === 'production') {
//	module.exports = require('./dist/messageParser.production.js');
//  } else {
//	module.exports = require('./dist/messageParser.production.js');
//  }

// to do: fix webpack issue on @rocket.chat/message-parser;
// to investigate: sometimes the order of messages change;

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
		return (
			<NewMarkdown
				username={username}
				getCustomEmoji={getCustomEmoji}
				useRealName={useRealName}
				tokens={md}
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
