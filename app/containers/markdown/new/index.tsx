import { MarkdownAST } from '@rocket.chat/message-parser';
import isEmpty from 'lodash/isEmpty';
import React from 'react';

import { IUserChannel, IUserMention, TOnLinkPress } from '../interfaces';
import BigEmoji from './BigEmoji';
import Code from './Code';
import Heading from './Heading';
import { KaTeX } from './Katex';
import LineBreak from './LineBreak';
import MarkdownContext from './MarkdownContext';
import OrderedList from './OrderedList';
import Paragraph from './Paragraph';
import Quote from './Quote';
import TaskList from './TaskList';
import UnorderedList from './UnorderedList';

interface IBodyProps {
	tokens?: MarkdownAST;
	mentions?: IUserMention[];
	channels?: IUserChannel[];
	getCustomEmoji?: Function;
	onLinkPress?: TOnLinkPress;
	navToRoomInfo?: Function;
	useRealName?: boolean;
	username: string;
}

const Body = ({
	tokens,
	mentions,
	channels,
	useRealName,
	username,
	navToRoomInfo,
	getCustomEmoji,
	onLinkPress
}: IBodyProps): React.ReactElement | null => {
	if (isEmpty(tokens)) {
		return null;
	}

	return (
		<MarkdownContext.Provider
			value={{
				mentions,
				channels,
				useRealName,
				username,
				navToRoomInfo,
				getCustomEmoji,
				onLinkPress
			}}
		>
			{tokens?.map((block, index) => {
				const key = `${block.type}-${index}`;
				switch (block.type) {
					case 'BIG_EMOJI':
						return <BigEmoji key={key} value={block.value} />;
					case 'UNORDERED_LIST':
						return <UnorderedList key={key} value={block.value} />;
					case 'ORDERED_LIST':
						return <OrderedList key={key} value={block.value} />;
					case 'TASKS':
						return <TaskList key={key} value={block.value} />;
					case 'QUOTE':
						return <Quote key={key} value={block.value} />;
					case 'PARAGRAPH':
						return <Paragraph key={key} value={block.value} />;
					case 'CODE':
						return <Code key={key} value={block.value} />;
					case 'HEADING':
						return <Heading key={key} value={block.value} level={block.level} />;
					case 'LINE_BREAK':
						return <LineBreak key={key} />;
					// This prop exists, but not even on the web it is treated, so...
					// https://github.com/RocketChat/Rocket.Chat/blob/develop/packages/gazzodown/src/Markup.tsx
					// case 'LIST_ITEM':
					// 	return <View />;
					case 'KATEX':
						return <KaTeX key={key} value={block.value} />;
					default:
						return null;
				}
			})}
		</MarkdownContext.Provider>
	);
};

export default Body;
