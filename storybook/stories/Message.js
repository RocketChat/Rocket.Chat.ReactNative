/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Provider } from 'react-redux';
import { storiesOf } from '@storybook/react-native';
// import moment from 'moment';

import MessageComponent from '../../app/containers/message/Message';
import messagesStatus from '../../app/constants/messagesStatus';
import MessageSeparator from '../../app/views/RoomView/Separator';
import MessageContext from '../../app/containers/message/Context';

import { themes } from '../../app/constants/colors';
import { store } from './index';

const _theme = 'light';

const styles = StyleSheet.create({
});

const user = {
	id: 'y8bd77ptZswPj3EW8',
	username: 'diego.mello',
	token: '79q6lH40W4ZRGLOshDiDiVlQaCc4f_lU9HNdHLAzuHz'
};
const author = {
	_id: 'userid',
	username: 'diego.mello'
};
const baseUrl = 'https://open.rocket.chat';
const date = new Date(2017, 10, 10, 10);
const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const getCustomEmoji = (content) => {
	const customEmoji = {
		marioparty: { name: content, extension: 'gif' },
		react_rocket: { name: content, extension: 'png' },
		nyan_rocket: { name: content, extension: 'png' }
	}[content];
	return customEmoji;
};

export const MessageDecorator = story => (
	<MessageContext.Provider
		value={{
			user,
			baseUrl,
			onPress: () => {},
			onLongPress: () => {},
			reactionInit: () => {},
			onErrorPress: () => {},
			replyBroadcast: () => {},
			onReactionPress: () => {},
			onDiscussionPress: () => {},
			onReactionLongPress: () => {},
			threadBadgeColor: themes.light.tunreadColor
		}}
	>
		{story()}
	</MessageContext.Provider>
);

export const Message = props => (
	<MessageComponent
		baseUrl={baseUrl}
		user={user}
		author={author}
		ts={date}
		timeFormat='LT'
		isHeader
		getCustomEmoji={getCustomEmoji}
		theme={_theme}
		{...props}
	/>
);

export const StoryProvider = story => <Provider store={store}>{story()}</Provider>;

const MessageScrollView = story => <ScrollView style={{ backgroundColor: themes[_theme].backgroundColor }}>{story()}</ScrollView>;

const stories = storiesOf('Message', module)
	.addDecorator(StoryProvider)
	.addDecorator(MessageScrollView)
	.addDecorator(MessageDecorator);

stories.add('Basic', () => (
	<>
		<Message msg='Message' />
		<Message msg={longText} />
	</>
));

stories.add('Grouped messages', () => (
	<>
		<Message msg='...' />
		<Message
			msg='Different user'
			author={{
				...author,
				username: longText
			}}
		/>
		<Message msg='This is the third message' isHeader={false} />
		<Message msg='This is the second message' isHeader={false} />
		<Message msg='This is the first message' />
	</>
));

stories.add('Without header', () => (
	<Message msg='Message' isHeader={false} />
));

stories.add('With alias', () => (
	<>
		<Message msg='Message' alias='Diego Mello' />
		<Message
			msg='Message'
			author={{
				...author,
				username: longText
			}}
			alias='Diego Mello'
		/>
	</>
));

stories.add('Edited', () => (
	<Message msg='Message' edited />
));

stories.add('Encrypted', () => (
	<>
		<Message
			msg='Message'
			type='e2e'
		/>
		<Message
			msg='Message Encrypted without Header'
			isHeader={false}
			type='e2e'
		/>
		<Message
			msg='Message Encrypted with Reactions'
			reactions={[{
				emoji: ':joy:',
				usernames: [user.username]
			}, {
				emoji: ':marioparty:',
				usernames: [user.username]
			}, {
				emoji: ':thinking:',
				usernames: [user.username]
			}]}
			onReactionPress={() => {}}
			type='e2e'
		/>
		<Message
			msg='Thread reply encrypted'
			tmid='1'
			tmsg='Thread with emoji :) :joy:'
			isThreadReply
			type='e2e'
		/>
		<Message
			msg='Temp message encrypted'
			status={messagesStatus.TEMP}
			isTemp
			type='e2e'
		/>
		<Message
			msg='Message Edited encrypted'
			edited
			type='e2e'
		/>
		<Message
			hasError
			msg='This message has error and is encrypted'
			status={messagesStatus.ERROR}
			onErrorPress={() => alert('Error pressed')}
			type='e2e'
		/>
		<Message
			msg='Read Receipt encrypted with Header'
			isReadReceiptEnabled
			read
			type='e2e'
		/>
		<Message
			msg='Read Receipt encrypted without Header'
			isReadReceiptEnabled
			read
			isHeader={false}
			type='e2e'
		/>
	</>
));

stories.add('Block Quote', () => (
	<>
		<Message msg='> Testing block quote' />
		<Message msg={'> Testing block quote\nTesting block quote'} />
	</>
));

stories.add('Lists', () => (
	<>
		<Message msg={'* Dogs\n  * cats\n  - cats'} />
		<Message msg={'1. Dogs \n 2. Cats'} />
		<Message msg='1. Dogs' />
		<Message msg='2. Cats' isHeader={false} />
	</>
));

stories.add('Static avatar', () => (
	<Message
		msg='Message'
		avatar='https://pbs.twimg.com/profile_images/1016397063649660929/14EIApTi_400x400.jpg'
	/>
));

stories.add('Full name', () => (
	<Message
		msg='Message'
		author={{
			...author,
			username: 'diego.mello',
			name: 'Diego Mello'
		}}
		useRealName
	/>
));

stories.add('Mentions', () => (
	<>
		<Message
			msg='@rocket.cat @diego.mello @all @here #general'
			mentions={[{
				username: 'rocket.cat'
			}, {
				username: 'diego.mello'
			}, {
				username: 'all'
			}, {
				username: 'here'
			}]}
			channels={[{
				name: 'general'
			}]}
		/>
		<Message
			msg='@rocket.cat Lorem ipsum dolor @diego.mello sit amet, @all consectetur adipiscing @here elit, sed do eiusmod tempor #general incididunt ut labore et dolore magna aliqua.'
			mentions={[{
				username: 'rocket.cat'
			}, {
				username: 'diego.mello'
			}, {
				username: 'all'
			}, {
				username: 'here'
			}]}
			channels={[{
				name: 'general'
			}]}
		/>
	</>
));

stories.add('Emojis', () => (
	<>
		<Message msg='👊🤙👏' />
		<Message msg='👏' />
		<Message msg=':react_rocket: :nyan_rocket: :marioparty:' />
		<Message msg=':react_rocket:' />
		<Message msg='🤙:react_rocket:' />
		<Message msg='🤙:react_rocket:🤙🤙' />
	</>
));

stories.add('Time format', () => (
	<Message msg='Testing' timeFormat='DD MMMM YYYY' />
));

stories.add('Reactions', () => (
	<>
		<Message
			msg='Reactions'
			reactions={[{
				emoji: ':joy:',
				usernames: [user.username]
			}, {
				emoji: ':marioparty:',
				usernames: new Array(99)
			}, {
				emoji: ':thinking:',
				usernames: new Array(999)
			}, {
				emoji: ':thinking:',
				usernames: new Array(9999)
			}]}
			onReactionPress={() => {}}
		/>
		<Message
			msg='Multiple Reactions'
			reactions={[{
				emoji: ':marioparty:',
				usernames: [user.username]
			}, {
				emoji: ':react_rocket:',
				usernames: [user.username]
			}, {
				emoji: ':nyan_rocket:',
				usernames: [user.username]
			}, {
				emoji: ':heart:',
				usernames: [user.username]
			}, {
				emoji: ':dog:',
				usernames: [user.username]
			}, {
				emoji: ':grinning:',
				usernames: [user.username]
			}, {
				emoji: ':grimacing:',
				usernames: [user.username]
			}, {
				emoji: ':grin:',
				usernames: [user.username]
			}]}
			onReactionPress={() => {}}
		/>
	</>
));

stories.add('Date and Unread separators', () => (
	<>
		<Message
			msg='Fourth message'
			author={{
				...author,
				username: 'rocket.cat'
			}}
		/>
		<MessageSeparator ts={date} unread theme={_theme} />
		<Message msg='Third message' />
		<MessageSeparator unread theme={_theme} />
		<Message
			msg='Second message'
			author={{
				...author,
				username: 'rocket.cat'
			}}
			isHeader={false}
		/>
		<Message
			msg='Second message'
			author={{
				...author,
				username: 'rocket.cat'
			}}
		/>
		<MessageSeparator ts={date} theme={_theme} />
		<Message msg='First message' />
	</>
));

stories.add('With image', () => (
	<>
		<Message
			attachments={[{
				title: 'This is a title',
				description: 'This is a description',
				image_url: '/dummypath'
			}]}
		/>
		<Message
			attachments={[{
				title: 'This is a title',
				description: 'This is a description :nyan_rocket:',
				image_url: '/dummypath'
			}]}
		/>
	</>
));

stories.add('With video', () => (
	<>
		<Message
			attachments={[{
				title: 'This is a title',
				description: 'This is a description :nyan_rocket:',
				video_url: '/dummypath'
			}]}
		/>
		<Message
			attachments={[{
				title: 'This is a title',
				video_url: '/dummypath'
			}]}
		/>
	</>
));

stories.add('With audio', () => (
	<>
		<Message
			attachments={[{
				title: 'This is a title',
				description: 'This is a description :nyan_rocket:',
				audio_url: '/dummypath'
			}]}
		/>
		<Message msg='First message' isHeader={false} />
		<Message
			attachments={[{
				title: 'This is a title',
				description: 'This is a description',
				audio_url: '/dummypath'
			}]}
			isHeader={false}
		/>
		<Message
			attachments={[{
				title: 'This is a title',
				audio_url: '/dummypath'
			}]}
			isHeader={false}
		/>
		<Message
			attachments={[{
				title: 'This is a title',
				audio_url: '/dummypath'
			}]}
			isHeader={false}
		/>
	</>
));

stories.add('With file', () => (
	<>
		<Message
			attachments={[{
				text: 'File.pdf',
				description: 'This is a description :nyan_rocket:'
			}]}
		/>
		<Message
			attachments={[{
				text: 'File.pdf',
				description: 'This is a description :nyan_rocket:'
			}]}
			isHeader={false}
		/>
	</>
));

stories.add('Message with reply', () => (
	<>
		<Message
			msg="I'm fine!"
			attachments={[{
				author_name: 'I\'m a very long long title and I\'ll break',
				ts: date,
				timeFormat: 'LT',
				text: 'How are you?'
			}]}
		/>
		<Message
			msg="I'm fine!"
			attachments={[{
				author_name: 'rocket.cat',
				ts: date,
				timeFormat: 'LT',
				text: 'How are you? :nyan_rocket:'
			}]}
		/>
	</>
));

stories.add('Message with read receipt', () => (
	<>
		<Message
			msg="I'm fine!"
			isReadReceiptEnabled
			unread
		/>
		<Message
			msg="I'm fine!"
			isReadReceiptEnabled
			unread
			isHeader={false}
		/>
		<Message
			msg="I'm fine!"
			isReadReceiptEnabled
			read
		/>
		<Message
			msg="I'm fine!"
			isReadReceiptEnabled
			read
			isHeader={false}
		/>
	</>
));

stories.add('Message with thread', () => (
	<>
		<Message
			msg='How are you?'
			tcount={1}
			tlm={date}
		/>
		<Message
			msg="I'm fine!"
			tmid='1'
			tmsg='How are you?'
			isThreadReply
		/>
		<Message
			msg="I'm fine!"
			tmid='1'
			tmsg='Thread with emoji :) :joy:'
			isThreadReply
		/>
		<Message
			msg="I'm fine!"
			tmid='1'
			tmsg={longText}
			isThreadReply
		/>
		<Message
			msg={longText}
			tmid='1'
			tmsg='How are you?'
			isThreadReply
		/>
		<Message
			msg={longText}
			tmid='1'
			tmsg={longText}
			isThreadReply
		/>
		<Message
			tmid='1'
			tmsg='Thread with attachment'
			attachments={[{
				title: 'This is a title',
				description: 'This is a description :nyan_rocket:',
				audio_url: '/file-upload/c4wcNhrbXJLBvAJtN/1535569819516.aac'
			}]}
			isThreadReply
		/>
	</>
));

stories.add('Sequential thread messages following thread button', () => (
	<>
		<Message
			msg='How are you?'
			tcount={1}
			tlm={date}
		/>
		<Message
			msg="I'm fine!"
			tmid='1'
			isThreadSequential
		/>
		<Message
			msg={longText}
			tmid='1'
			isThreadSequential
		/>
		<Message
			attachments={[{
				title: 'This is a title',
				description: 'This is a description',
				audio_url: '/file-upload/c4wcNhrbXJLBvAJtN/1535569819516.aac'
			}]}
			tmid='1'
			isThreadSequential
		/>
	</>
));

stories.add('Sequential thread messages following thread reply', () => (
	<>
		<Message
			msg="I'm fine!"
			tmid='1'
			tmsg='How are you?'
			isThreadReply
		/>
		<Message
			msg='Cool!'
			tmid='1'
			isThreadSequential
		/>
		<Message
			msg={longText}
			tmid='1'
			isThreadSequential
		/>
		<Message
			attachments={[{
				title: 'This is a title',
				description: 'This is a description',
				audio_url: '/file-upload/c4wcNhrbXJLBvAJtN/1535569819516.aac'
			}]}
			tmid='1'
			isThreadSequential
		/>
	</>
));

stories.add('Discussion', () => (
	<>
		<Message
			type='discussion-created'
			drid='aisduhasidhs'
			dcount={null}
			dlm={null}
			msg='This is a discussion'
		/>
		<Message
			type='discussion-created'
			drid='aisduhasidhs'
			dcount={1}
			dlm={date}
			msg='This is a discussion'
		/>
		<Message
			type='discussion-created'
			drid='aisduhasidhs'
			dcount={10}
			dlm={date}
			msg={longText}
		/>
		<Message
			type='discussion-created'
			drid='aisduhasidhs'
			dcount={1000}
			dlm={date}
			msg='This is a discussion'
		/>
	</>
));

stories.add('URL', () => (
	<>
		<Message
			urls={[{
				url: 'https://rocket.chat',
				image: 'https://rocket.chat/images/blog/post.jpg',
				title: 'Rocket.Chat - Free, Open Source, Enterprise Team Chat',
				description: 'Rocket.Chat is the leading open source team chat software solution. Free, unlimited and completely customizable with on-premises and SaaS cloud hosting.'
			}, {
				url: 'https://google.com',
				title: 'Google',
				description: 'Search the world\'s information, including webpages, images, videos and more. Google has many special features to help you find exactly what you\'re looking for.'
			}]}
		/>
		<Message
			urls={[{
				url: 'https://google.com',
				title: 'Google',
				description: 'Search the world\'s information, including webpages, images, videos and more. Google has many special features to help you find exactly what you\'re looking for.'
			}]}
			msg='Message :nyan_rocket:'
		/>
		<Message
			urls={[{
				url: 'https://google.com',
				title: 'Google',
				description: 'Search the world\'s information, including webpages, images, videos and more. Google has many special features to help you find exactly what you\'re looking for.'
			}]}
			isHeader={false}
		/>
	</>
));

stories.add('Custom fields', () => (
	<>
		<Message
			msg='Message'
			attachments={[{
				author_name: 'rocket.cat',
				ts: date,
				timeFormat: 'LT',
				text: 'Custom fields',
				fields: [{
					title: 'Field 1',
					value: 'Value 1'
				}, {
					title: 'Field 2',
					value: 'Value 2'
				}, {
					title: 'Field 3',
					value: 'Value 3'
				}, {
					title: 'Field 4',
					value: 'Value 4'
				}, {
					title: 'Field 5',
					value: 'Value 5'
				}]
			}]}
		/>
	</>
));

stories.add('Two short custom fields with markdown', () => (
	<Message
		msg='Message'
		attachments={[{
			author_name: 'rocket.cat',
			ts: date,
			timeFormat: 'LT',
			text: 'Custom fields',
			fields: [{
				title: 'Field 1',
				value: 'Value 1',
				short: true
			}, {
				title: 'Field 2',
				value: '[Value 2](https://google.com/)',
				short: true
			}]
		}, {
			author_name: 'rocket.cat',
			ts: date,
			timeFormat: 'LT',
			text: 'Custom fields 2',
			fields: [{
				title: 'Field 1',
				value: 'Value 1',
				short: true
			}, {
				title: 'Field 2',
				value: '**Value 2**',
				short: true
			}]
		}]}
	/>
));

stories.add('Colored attachments', () => (
	<Message
		attachments={[{
			color: 'red',
			fields: [{
				title: 'Field 1',
				value: 'Value 1',
				short: true
			}, {
				title: 'Field 2',
				value: 'Value 2',
				short: true
			}]
		}, {
			color: 'green',
			fields: [{
				title: 'Field 1',
				value: 'Value 1',
				short: true
			}, {
				title: 'Field 2',
				value: 'Value 2',
				short: true
			}]
		}, {
			color: 'blue',
			fields: [{
				title: 'Field 1',
				value: 'Value 1',
				short: true
			}, {
				title: 'Field 2',
				value: 'Value 2',
				short: true
			}]
		}]}
	/>
));

stories.add('Broadcast', () => (
	<Message msg='Broadcasted message' broadcast replyBroadcast={() => alert('broadcast!')} />
));

stories.add('Archived', () => (
	<Message msg='This message is inside an archived room' archived />
));

stories.add('Error', () => (
	<>
		<Message hasError msg='This message has error' status={messagesStatus.ERROR} onErrorPress={() => alert('Error pressed')} />
		<Message hasError msg='This message has error too' status={messagesStatus.ERROR} onErrorPress={() => alert('Error pressed')} isHeader={false} />
	</>
));

stories.add('Temp', () => (
	<Message msg='Temp message' status={messagesStatus.TEMP} isTemp />
));

stories.add('Editing', () => (
	<Message msg='Message being edited' editing />
));

stories.add('System messages', () => (
	<>
		<Message type='rm' isInfo />
		<Message type='uj' isInfo />
		<Message
			msg='New name'
			type='message_pinned'
			isInfo
			attachments={[{
				author_name: 'rocket.cat',
				ts: date,
				timeFormat: 'LT',
				text: 'First message'
			}]}
		/>
		<Message type='ul' isInfo />
		<Message msg='rocket.cat' type='ru' isInfo />
		<Message msg='rocket.cat' type='au' isInfo />
		<Message msg='rocket.cat' type='user-muted' isInfo />
		<Message msg='rocket.cat' type='user-unmuted' isInfo />
		<Message
			msg='rocket.cat'
			role='admin'
			type='subscription-role-added'
			isInfo
		/>
		<Message
			msg='rocket.cat'
			role='admin'
			type='subscription-role-removed'
			isInfo
		/>
		<Message msg='New name' type='r' isInfo />
		<Message msg='new description' type='room_changed_description' isInfo />
		<Message msg='new announcement' type='room_changed_announcement' isInfo />
		<Message msg='new topic' type='room_changed_topic' isInfo />
		<Message msg='public' type='room_changed_privacy' isInfo />
		<Message type='room_e2e_disabled' isInfo />
		<Message type='room_e2e_enabled' isInfo />
	</>
));

stories.add('Ignored', () => (
	<Message isIgnored />
));

stories.add('Custom style', () => (
	<Message msg='Message' style={[styles.normalize, { backgroundColor: '#ddd' }]} />
));
