import React from 'react';
import { ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import MessageComponent from './Message';
import { E2E_MESSAGE_TYPE, messagesStatus, themes } from '../../lib/constants';
import MessageSeparator from '../../views/RoomView/Separator';
import MessageContext from './Context';

const _theme = 'light';

const user = {
	id: 'y8bd77ptZswPj3EW8',
	username: 'diego.mello',
	token: 'abc'
};
const author = {
	_id: 'userid',
	username: 'diego.mello'
};

const longNameAuthor = {
	_id: 'userid',
	username: 'Long name user looooong name user'
};

const baseUrl = 'https://open.rocket.chat';
const date = new Date(2017, 10, 10, 10);
const longText =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const getCustomEmoji = (content: string) => {
	const customEmoji = {
		marioparty: { name: content, extension: 'gif' },
		react_rocket: { name: content, extension: 'png' },
		nyan_rocket: { name: content, extension: 'png' }
	}[content];
	return customEmoji;
};

export default {
	title: 'Message',
	decorators: [
		(Story: any) => (
			<NavigationContainer>
				<ScrollView style={{ backgroundColor: themes[_theme].backgroundColor }}>
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
						<Story />
					</MessageContext.Provider>
				</ScrollView>
			</NavigationContainer>
		)
	]
};

export const Message = (props: any) => (
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

export const Basic = () => (
	<>
		<Message msg='Message' />
		<Message msg={longText} />
	</>
);

export const GroupedMessages = () => (
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
);

export const WithoutHeader = () => <Message msg='Message' isHeader={false} />;

export const WithAlias = () => (
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
);

export const Edited = () => (
	<>
		<Message msg='Message header' isEdited />
		<Message msg='Message without header' isEdited isHeader={false} />
	</>
);

export const Encrypted = () => (
	<>
		<Message msg='Message' type='e2e' />
		<Message msg='Message Encrypted without Header' isHeader={false} type='e2e' />
		<Message
			msg='Message Encrypted with Reactions'
			reactions={[
				{
					emoji: ':joy:',
					usernames: [user.username]
				},
				{
					emoji: ':marioparty:',
					usernames: [user.username]
				},
				{
					emoji: ':thinking:',
					usernames: [user.username]
				}
			]}
			onReactionPress={() => {}}
			type='e2e'
		/>
		<Message msg='Thread reply encrypted' tmid='1' tmsg='Thread with emoji :) :joy:' isThreadReply type='e2e' />
		<Message msg='Temp message encrypted' status={messagesStatus.TEMP} isTemp type='e2e' />
		<Message msg='Message Edited encrypted' edited type='e2e' />
		<Message
			hasError
			msg='This message has error and is encrypted'
			status={messagesStatus.ERROR}
			onErrorPress={() => alert('Error pressed')}
			type='e2e'
		/>
		<Message msg='Read Receipt encrypted with Header' isReadReceiptEnabled read type='e2e' />
		<Message msg='Read Receipt encrypted without Header' isReadReceiptEnabled read isHeader={false} type='e2e' />
	</>
);

export const BlockQuote = () => (
	<>
		<Message msg='> Testing block quote' />
		<Message msg={'> Testing block quote\nTesting block quote'} />
	</>
);

export const Lists = () => (
	<>
		<Message msg={'* Dogs\n  * cats\n  - cats'} />
		<Message msg={'1. Dogs \n 2. Cats'} />
		<Message msg='1. Dogs' />
		<Message msg='2. Cats' isHeader={false} />
	</>
);

export const StaticAvatar = () => (
	<Message msg='Message' avatar='https://pbs.twimg.com/profile_images/1016397063649660929/14EIApTi_400x400.jpg' />
);

export const FullName = () => (
	<Message
		msg='Message'
		author={{
			...author,
			username: 'diego.mello',
			name: 'Diego Mello'
		}}
		useRealName
	/>
);

export const Mentions = () => (
	<>
		<Message
			msg='@rocket.cat @diego.mello @all @here #general'
			mentions={[
				{
					username: 'rocket.cat'
				},
				{
					username: 'diego.mello'
				},
				{
					username: 'all'
				},
				{
					username: 'here'
				}
			]}
			channels={[
				{
					name: 'general'
				}
			]}
		/>
		<Message
			msg='@rocket.cat Lorem ipsum dolor @diego.mello sit amet, @all consectetur adipiscing @here elit, sed do eiusmod tempor #general incididunt ut labore et dolore magna aliqua.'
			mentions={[
				{
					username: 'rocket.cat'
				},
				{
					username: 'diego.mello'
				},
				{
					username: 'all'
				},
				{
					username: 'here'
				}
			]}
			channels={[
				{
					name: 'general'
				}
			]}
		/>
	</>
);

export const Emojis = () => (
	<>
		<Message msg='👊🤙👏' />
		<Message msg='👏' />
		<Message msg=':react_rocket: :nyan_rocket: :marioparty:' />
		<Message msg=':react_rocket:' />
		<Message msg='🤙:react_rocket:' />
		<Message msg='🤙:react_rocket:🤙🤙' />
	</>
);

export const TimeFormat = () => <Message msg='Testing' timeFormat='DD MMMM YYYY' />;

export const Reactions = () => (
	<>
		<Message
			msg='Reactions'
			reactions={[
				{
					emoji: ':joy:',
					usernames: [user.username]
				},
				{
					emoji: ':marioparty:',
					usernames: new Array(99)
				},
				{
					emoji: ':thinking:',
					usernames: new Array(999)
				},
				{
					emoji: ':thinking:',
					usernames: new Array(9999)
				}
			]}
			onReactionPress={() => {}}
		/>
		<Message
			msg='Multiple Reactions'
			reactions={[
				{
					emoji: ':marioparty:',
					usernames: [user.username]
				},
				{
					emoji: ':react_rocket:',
					usernames: [user.username]
				},
				{
					emoji: ':nyan_rocket:',
					usernames: [user.username]
				},
				{
					emoji: ':heart:',
					usernames: [user.username]
				},
				{
					emoji: ':dog:',
					usernames: [user.username]
				},
				{
					emoji: ':grinning:',
					usernames: [user.username]
				},
				{
					emoji: ':grimacing:',
					usernames: [user.username]
				},
				{
					emoji: ':grin:',
					usernames: [user.username]
				}
			]}
			onReactionPress={() => {}}
		/>
	</>
);

export const DateAndUnreadSeparators = () => (
	<>
		<Message
			msg='Fourth message'
			author={{
				...author,
				username: 'rocket.cat'
			}}
		/>
		<MessageSeparator ts={date} unread />
		<Message msg='Third message' />
		<MessageSeparator unread ts={null} />
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
		<MessageSeparator ts={date} unread={false} />
		<Message msg='First message' />
	</>
);

export const WithImage = () => (
	<>
		<Message
			attachments={[
				{
					title: 'This is a title',
					description: 'This is a description',
					image_url: '/dummypath'
				}
			]}
		/>
		<Message
			attachments={[
				{
					title: 'This is a title',
					description: 'This is a description :nyan_rocket:',
					image_url: '/dummypath'
				}
			]}
		/>
	</>
);

export const WithVideo = () => (
	<>
		<Message
			attachments={[
				{
					title: 'This is a title',
					description: 'This is a description :nyan_rocket:',
					video_url: '/dummypath'
				}
			]}
		/>
		<Message
			attachments={[
				{
					title: 'This is a title',
					video_url: '/dummypath'
				}
			]}
		/>
	</>
);

export const WithAudio = () => (
	<>
		<Message
			attachments={[
				{
					title: 'This is a title',
					description: 'This is a description :nyan_rocket:',
					audio_url: '/dummypath'
				}
			]}
		/>
		<Message msg='First message' isHeader={false} />
		<Message
			attachments={[
				{
					title: 'This is a title',
					description: 'This is a description',
					audio_url: '/dummypath'
				}
			]}
			isHeader={false}
		/>
		<Message
			attachments={[
				{
					title: 'This is a title',
					audio_url: '/dummypath'
				}
			]}
			isHeader={false}
		/>
		<Message
			attachments={[
				{
					title: 'This is a title',
					audio_url: '/dummypath'
				}
			]}
			isHeader={false}
		/>
	</>
);

export const WithFile = () => (
	<>
		<Message
			attachments={[
				{
					text: 'File.pdf',
					description: 'This is a description :nyan_rocket:'
				}
			]}
		/>
		<Message
			attachments={[
				{
					text: 'File.pdf',
					description: 'This is a description :nyan_rocket:'
				}
			]}
			isHeader={false}
		/>
	</>
);

export const MessageWithReply = () => (
	<>
		<Message
			msg="I'm fine!"
			attachments={[
				{
					author_name: "I'm a very long long title and I'll break",
					ts: date,
					timeFormat: 'LT',
					text: 'How are you?'
				}
			]}
		/>
		<Message
			msg="I'm fine!"
			attachments={[
				{
					author_name: 'rocket.cat',
					ts: date,
					timeFormat: 'LT',
					text: 'How are you? :nyan_rocket:'
				}
			]}
		/>
		<Message
			msg='Looks cool!'
			attachments={[
				{
					author_name: 'rocket.cat',
					attachments: [
						{
							author_name: 'rocket.cat',
							ts: date,
							timeFormat: 'LT',
							description: 'What you think about this one?',
							image_url: 'https://octodex.github.com/images/yaktocat.png'
						}
					],
					text: ''
				}
			]}
		/>
	</>
);

export const MessageWithReadReceipt = () => (
	<>
		<Message msg="I'm fine!" isReadReceiptEnabled unread />
		<Message msg="I'm fine!" isReadReceiptEnabled unread isHeader={false} />
		<Message msg="I'm fine!" isReadReceiptEnabled read />
		<Message msg="I'm fine!" isReadReceiptEnabled read isHeader={false} />
	</>
);

export const MessageWithThread = () => (
	<>
		<Message msg='How are you?' tcount={1} tlm={date} />
		<Message msg="I'm fine!" tmid='1' tmsg='How are you?' isThreadReply />
		<Message msg="I'm fine!" tmid='1' tmsg='Thread with emoji :) :joy:' isThreadReply />
		<Message msg="I'm fine!" tmid='1' tmsg={longText} isThreadReply />
		<Message msg={longText} tmid='1' tmsg='How are you?' isThreadReply />
		<Message msg={longText} tmid='1' tmsg={longText} isThreadReply />
		<Message
			tmid='1'
			tmsg='Thread with attachment'
			attachments={[
				{
					title: 'This is a title',
					description: 'This is a description :nyan_rocket:',
					audio_url: '/file-upload/c4wcNhrbXJLBvAJtN/1535569819516.aac'
				}
			]}
			isThreadReply
		/>
	</>
);

export const SequentialThreadMessagesFollowingThreadButton = () => (
	<>
		<Message msg='How are you?' tcount={1} tlm={date} />
		<Message msg="I'm fine!" tmid='1' isThreadSequential />
		<Message msg={longText} tmid='1' isThreadSequential />
		<Message
			attachments={[
				{
					title: 'This is a title',
					description: 'This is a description',
					audio_url: '/file-upload/c4wcNhrbXJLBvAJtN/1535569819516.aac'
				}
			]}
			tmid='1'
			isThreadSequential
		/>
	</>
);

export const SequentialThreadMessagesFollowingThreadReply = () => (
	<>
		<Message msg="I'm fine!" tmid='1' tmsg='How are you?' isThreadReply />
		<Message msg='Cool!' tmid='1' isThreadSequential />
		<Message msg={longText} tmid='1' isThreadSequential />
		<Message
			attachments={[
				{
					title: 'This is a title',
					description: 'This is a description',
					audio_url: '/file-upload/c4wcNhrbXJLBvAJtN/1535569819516.aac'
				}
			]}
			tmid='1'
			isThreadSequential
		/>
	</>
);

export const Discussion = () => (
	<>
		<Message type='discussion-created' drid='aisduhasidhs' dcount={null} dlm={null} msg='This is a discussion' />
		<Message type='discussion-created' drid='aisduhasidhs' dcount={1} dlm={date} msg='This is a discussion' />
		<Message type='discussion-created' drid='aisduhasidhs' dcount={10} dlm={date} msg={longText} />
		<Message type='discussion-created' drid='aisduhasidhs' dcount={1000} dlm={date} msg='This is a discussion' />
	</>
);

export const URL = () => (
	<>
		<Message
			urls={[
				{
					url: 'https://rocket.chat',
					image: 'https://rocket.chat/images/blog/post.jpg',
					title: 'Rocket.Chat - Free, Open Source, Enterprise Team Chat',
					description:
						'Rocket.Chat is the leading open source team chat software solution. Free, unlimited and completely customizable with on-premises and SaaS cloud hosting.'
				},
				{
					url: 'https://google.com',
					title: 'Google',
					description:
						"Search the world's information, including webpages, images, videos and more. Google has many special features to help you find exactly what you're looking for."
				}
			]}
		/>
		<Message
			urls={[
				{
					url: 'https://google.com',
					title: 'Google',
					description:
						"Search the world's information, including webpages, images, videos and more. Google has many special features to help you find exactly what you're looking for."
				}
			]}
			msg='Message :nyan_rocket:'
		/>
		<Message
			urls={[
				{
					url: 'https://google.com',
					title: 'Google',
					description:
						"Search the world's information, including webpages, images, videos and more. Google has many special features to help you find exactly what you're looking for."
				}
			]}
			isHeader={false}
		/>
	</>
);

export const CustomFields = () => (
	<>
		<Message
			msg='Message'
			attachments={[
				{
					author_name: 'rocket.cat',
					ts: date,
					timeFormat: 'LT',
					text: 'Custom fields',
					fields: [
						{
							title: 'Field 1',
							value: 'Value 1'
						},
						{
							title: 'Field 2',
							value: 'Value 2'
						},
						{
							title: 'Field 3',
							value: 'Value 3'
						},
						{
							title: 'Field 4',
							value: 'Value 4'
						},
						{
							title: 'Field 5',
							value: 'Value 5'
						}
					]
				}
			]}
		/>
	</>
);

export const TwoShortCustomFieldsWithMarkdown = () => (
	<Message
		msg='Message'
		attachments={[
			{
				author_name: 'rocket.cat',
				ts: date,
				timeFormat: 'LT',
				text: 'Custom fields',
				fields: [
					{
						title: 'Field 1',
						value: 'Value 1',
						short: true
					},
					{
						title: 'Field 2',
						value: '[Value 2](https://google.com/)',
						short: true
					}
				]
			},
			{
				author_name: 'rocket.cat',
				ts: date,
				timeFormat: 'LT',
				text: 'Custom fields 2',
				fields: [
					{
						title: 'Field 1',
						value: 'Value 1',
						short: true
					},
					{
						title: 'Field 2',
						value: '**Value 2**',
						short: true
					}
				]
			}
		]}
	/>
);

export const ColoredAttachments = () => (
	<Message
		attachments={[
			{
				color: 'red',
				fields: [
					{
						title: 'Field 1',
						value: 'Value 1',
						short: true
					},
					{
						title: 'Field 2',
						value: 'Value 2',
						short: true
					}
				]
			},
			{
				color: 'green',
				fields: [
					{
						title: 'Field 1',
						value: 'Value 1',
						short: true
					},
					{
						title: 'Field 2',
						value: 'Value 2',
						short: true
					}
				]
			},
			{
				color: 'blue',
				fields: [
					{
						title: 'Field 1',
						value: 'Value 1',
						short: true
					},
					{
						title: 'Field 2',
						value: 'Value 2',
						short: true
					}
				]
			}
		]}
	/>
);

export const Broadcast = () => <Message msg='Broadcasted message' broadcast replyBroadcast={() => alert('broadcast!')} />;

export const Archived = () => <Message msg='This message is inside an archived room' archived />;

export const Error = () => (
	<>
		<Message hasError msg='This message has error' status={messagesStatus.ERROR} onErrorPress={() => alert('Error pressed')} />
		<Message
			hasError
			msg='This message has error too'
			status={messagesStatus.ERROR}
			onErrorPress={() => alert('Error pressed')}
			isHeader={false}
		/>
	</>
);

export const Temp = () => <Message msg='Temp message' status={messagesStatus.TEMP} isTemp />;

export const Editing = () => <Message msg='Message being edited' editing />;

export const SystemMessages = () => (
	<>
		<Message type='rm' isInfo />
		<Message type='uj' isInfo />
		<Message
			msg='New name'
			type='message_pinned'
			isInfo
			attachments={[
				{
					author_name: 'rocket.cat',
					ts: date,
					timeFormat: 'LT',
					text: 'First message'
				}
			]}
		/>
		<Message type='ul' isInfo />
		<Message msg='rocket.cat' type='ru' isInfo />
		<Message msg='rocket.cat' type='au' isInfo />
		<Message msg='rocket.cat' type='user-muted' isInfo />
		<Message msg='rocket.cat' type='user-unmuted' isInfo />
		<Message msg='rocket.cat' role='admin' type='subscription-role-added' isInfo />
		<Message msg='rocket.cat' role='admin' type='subscription-role-removed' isInfo />
		<Message msg='New name' type='r' isInfo />
		<Message msg='new description' type='room_changed_description' isInfo />
		<Message msg='new announcement' type='room_changed_announcement' isInfo />
		<Message msg='new topic' type='room_changed_topic' isInfo />
		<Message msg='public' type='room_changed_privacy' isInfo />
		<Message type='room_e2e_disabled' isInfo />
		<Message type='room_e2e_enabled' isInfo />
		<Message msg='rocket.cat' type='removed-user-from-team' isInfo />
		<Message msg='rocket.cat' type='added-user-to-team' isInfo />
		<Message type='user-added-room-to-team' isInfo msg='channel-name' />
		<Message type='user-converted-to-team' isInfo msg='channel-name' />
		<Message type='user-converted-to-channel' isInfo msg='channel-name' />
		<Message type='user-deleted-room-from-team' isInfo msg='channel-name' />
		<Message type='user-removed-room-from-team' isInfo msg='channel-name' />
	</>
);

export const Ignored = () => <Message isIgnored />;

export const CustomStyle = () => <Message msg='Message' style={[{ backgroundColor: '#ddd' }]} />;

export const ShowButtonAsAttachment = () => (
	<Message
		attachments={[
			{
				text: 'Test Button',
				actions: [
					{
						type: 'button',
						text: 'Text button',
						msg: 'Response message',
						msg_in_chat_window: true
					}
				]
			}
		]}
	/>
);

export const ThumbnailFromServer = () => (
	<Message
		msg='this is a thumbnail'
		attachments={[
			{
				text: 'Image text',
				thumb_url: 'https://images-na.ssl-images-amazon.com/images/I/71jKxPAMFbL._AC_SL1500_.jpg',
				title: 'Title',
				title_link: 'https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/2975'
			}
		]}
	/>
);

export const LongNameUser = () => (
	<>
		<Message msg={'this is a normal message'} author={longNameAuthor} />
		<Message msg={'Edited message'} author={longNameAuthor} isEdited />
		<Message msg={'Encrypted message'} author={longNameAuthor} type={E2E_MESSAGE_TYPE} />
		<Message msg={'Error message'} author={longNameAuthor} hasError />
		<Message msg={'Message with read receipt'} author={longNameAuthor} isReadReceiptEnabled read />
		<Message msg={'Message with read receipt'} author={longNameAuthor} isReadReceiptEnabled read type={E2E_MESSAGE_TYPE} />
		<Message
			msg={'Show all icons '}
			author={longNameAuthor}
			isEdited
			type={E2E_MESSAGE_TYPE}
			hasError
			isReadReceiptEnabled
			read
		/>

		<Message
			msg={longText}
			author={longNameAuthor}
			isHeader={false}
			isEdited
			type={E2E_MESSAGE_TYPE}
			hasError
			isReadReceiptEnabled
			read
		/>

		<Message
			msg='small message'
			author={longNameAuthor}
			isHeader={false}
			isEdited
			type={E2E_MESSAGE_TYPE}
			hasError
			isReadReceiptEnabled
			read
		/>
	</>
);
