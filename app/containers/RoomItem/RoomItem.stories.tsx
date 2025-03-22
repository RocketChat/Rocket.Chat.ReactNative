import React from 'react';
import { Dimensions } from 'react-native';

import { longText } from '../../../.storybook/utils';
import { DisplayMode } from '../../lib/constants';
import RoomItemComponent from './RoomItem';

const { width } = Dimensions.get('window');
const _theme = 'light';
const lastMessage = {
	u: {
		username: 'diego.mello'
	},
	msg: longText
};
const updatedAt = {
	date: '10:00'
};

const RoomItem = (props: any) => (
	<RoomItemComponent
		type='d'
		name='rocket.cat'
		avatar='rocket.cat'
		width={width}
		theme={_theme}
		showAvatar
		displayMode={DisplayMode.Expanded}
		{...updatedAt}
		{...props}
	/>
);

export default {
	title: 'RoomItem'
};

export const Basic = () => <RoomItem />;

export const Touch = () => <RoomItem onPress={() => alert('on press')} onLongPress={() => alert('on long press')} />;

export const User = () => (
	<>
		<RoomItem name='diego.mello' avatar='diego.mello' userId='abc' />
		<RoomItem name={longText} userId='abc' />
	</>
);

export const Type = () => (
	<>
		<RoomItem type='d' userId='abc' />
		<RoomItem type='c' />
		<RoomItem type='p' />
		<RoomItem type='l' />
		<RoomItem type='discussion' />
		<RoomItem type='d' isGroupChat />
		<RoomItem type='&' />
	</>
);

export const Alerts = () => (
	<>
		<RoomItem alert />
		<RoomItem alert name='unread' unread={1} />
		<RoomItem alert name='unread' unread={1000} />
		<RoomItem alert name='user mentions' unread={1} userMentions={1} />
		<RoomItem alert name='group mentions' unread={1} groupMentions={1} />
		<RoomItem alert name='thread unread' tunread={[1]} />
		<RoomItem alert name='thread unread user' tunread={[1]} tunreadUser={[1]} />
		<RoomItem alert name='thread unread group' tunread={[1]} tunreadGroup={[1]} />
		<RoomItem name='user mentions priority 1' alert unread={1} userMentions={1} groupMentions={1} tunread={[1]} />
		<RoomItem name='group mentions priority 2' alert unread={1} groupMentions={1} tunread={[1]} />
		<RoomItem name='thread unread priority 3' alert unread={1} tunread={[1]} />
	</>
);

export const Tag = () => (
	<>
		<RoomItem autoJoin />
		<RoomItem showLastMessage autoJoin />
		<RoomItem name={longText} autoJoin />
		<RoomItem name={longText} autoJoin showLastMessage />
	</>
);

export const LastMessage = () => (
	<>
		<RoomItem showLastMessage />
		<RoomItem
			showLastMessage
			lastMessage={{
				u: {
					username: 'rocket.chat'
				},
				msg: '2'
			}}
		/>
		<RoomItem
			showLastMessage
			lastMessage={{
				u: {
					username: 'diego.mello'
				},
				msg: '1'
			}}
			username='diego.mello'
		/>
		<RoomItem showLastMessage lastMessage={lastMessage} />
		<RoomItem showLastMessage alert unread={1} lastMessage={lastMessage} />
		<RoomItem showLastMessage alert unread={1000} lastMessage={lastMessage} />
		<RoomItem showLastMessage alert tunread={[1]} lastMessage={lastMessage} />
	</>
);

export const CondensedRoomItem = () => (
	<>
		<RoomItem showLastMessage alert tunread={[1]} lastMessage={lastMessage} displayMode={DisplayMode.Condensed} />
		<RoomItem showLastMessage alert name='unread' unread={1000} displayMode={DisplayMode.Condensed} />

		<RoomItem type='c' displayMode={DisplayMode.Condensed} autoJoin />
	</>
);

export const CondensedRoomItemWithoutAvatar = () => (
	<>
		<RoomItem
			showLastMessage
			alert
			tunread={[1]}
			lastMessage={lastMessage}
			displayMode={DisplayMode.Condensed}
			showAvatar={false}
		/>
		<RoomItem type='p' displayMode={DisplayMode.Condensed} showAvatar={false} />
		<RoomItem name={longText} autoJoin displayMode={DisplayMode.Condensed} showAvatar={false} />
	</>
);

export const ExpandedRoomItemWithoutAvatar = () => (
	<>
		<RoomItem
			showLastMessage
			alert
			tunread={[1]}
			lastMessage={lastMessage}
			displayMode={DisplayMode.Expanded}
			showAvatar={false}
		/>
		<RoomItem
			showLastMessage
			alert
			tunread={[1]}
			lastMessage={lastMessage}
			displayMode={DisplayMode.Expanded}
			showAvatar={false}
		/>
		<RoomItem showLastMessage alert lastMessage={lastMessage} displayMode={DisplayMode.Expanded} showAvatar={false} />
	</>
);

export const OmnichannelIcon = () => (
	<>
		<RoomItem type='l' sourceType={{ type: 'widget' }} status='online' />
		<RoomItem type='l' sourceType={{ type: 'widget' }} status='away' />
		<RoomItem type='l' sourceType={{ type: 'widget' }} status='loading' />
		<RoomItem type='l' sourceType={{ type: 'widget' }} />
		<RoomItem type='l' sourceType={{ type: 'email' }} status='online' />
		<RoomItem type='l' sourceType={{ type: 'email' }} />
		<RoomItem type='l' sourceType={{ type: 'sms' }} status='online' />
		<RoomItem type='l' sourceType={{ type: 'sms' }} />
		<RoomItem type='l' sourceType={{ type: 'other' }} status='online' />
		<RoomItem type='l' sourceType={{ type: 'other' }} />
	</>
);
