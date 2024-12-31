import React, { PureComponent } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { MarkdownAST, parse } from '@rocket.chat/message-parser';

import NewMarkdown from './new';
import { IUserMention, IUserChannel, TOnLinkPress } from './interfaces';
import { TGetCustomEmoji } from '../../definitions/IEmoji';
import { TSupportedThemes, withTheme } from '../../theme';

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

class Markdown extends PureComponent<IMarkdownProps, any> {
	constructor(props: IMarkdownProps) {
		super(props);
	}

	get isNewMarkdown(): boolean {
		const { md } = this.props;
		return !!md;
	}

	render() {
		const {
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
		} = this.props;

		if (!msg) {
			return null;
		}
		if (!isTranslated) {
			const tokens = md ?? parse(msg);
			return (
				<NewMarkdown
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
	}
}

export default withTheme(Markdown);
