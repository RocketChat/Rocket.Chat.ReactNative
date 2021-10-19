import React from 'react';
import { MarkdownAST } from '@rocket.chat/message-parser';

import Quote from './Quote';
import Paragraph from './Paragraph';
import Heading from './Heading';
import Code from './Code';
import BigEmoji from './BigEmoji';
import OrderedList from './OrderedList';
import UnorderedList from './UnorderedList';
import { UserMention } from '../../message/interfaces';
import TaskList from './TaskList';

interface IBodyProps {
	tokens: MarkdownAST;
	mentions: UserMention[];
	channels: {
		name: string;
		_id: number;
	}[];
	getCustomEmoji?: Function;
	navToRoomInfo: Function;
	useRealName: boolean;
	username: string;
	baseUrl: string;
}

const Body = ({
	tokens,
	mentions,
	channels,
	useRealName,
	username,
	navToRoomInfo,
	getCustomEmoji,
	baseUrl
}: IBodyProps): JSX.Element => (
	<>
		{tokens.map(block => {
			switch (block.type) {
				case 'BIG_EMOJI':
					return <BigEmoji value={block.value} getCustomEmoji={getCustomEmoji!} baseUrl={baseUrl} />;
				case 'UNORDERED_LIST':
					return <UnorderedList value={block.value} />;
				case 'ORDERED_LIST':
					return <OrderedList value={block.value} />;
				case 'TASKS':
					return <TaskList value={block.value} />;
				case 'QUOTE':
					return <Quote value={block.value} />;
				case 'PARAGRAPH':
					return (
						<Paragraph
							value={block.value}
							navToRoomInfo={navToRoomInfo}
							baseUrl={baseUrl}
							getCustomEmoji={getCustomEmoji!}
							channels={channels}
							mentions={mentions}
							useRealName={useRealName}
							username={username}
						/>
					);
				case 'CODE':
					return <Code value={block.value} />;
				case 'HEADING':
					return <Heading value={block.value} level={block.level} />;
				default:
					return null;
			}
		})}
	</>
);

export default Body;
