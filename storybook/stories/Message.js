import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
// import moment from 'moment';

import MessageComponent from '../../app/containers/message/Message';
import StoriesSeparator from './StoriesSeparator';
import messagesStatus from '../../app/constants/messagesStatus';
import MessageSeparator from '../../app/views/RoomView/Separator';

import { themes } from '../../app/constants/colors';

let _theme = 'light';

const styles = StyleSheet.create({
	separator: {
		marginTop: 30,
		marginBottom: 0
	}
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

const Message = props => (
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

// eslint-disable-next-line react/prop-types
const Separator = ({ title, theme }) => <StoriesSeparator title={title} theme={theme} style={styles.separator} />;

// eslint-disable-next-line react/prop-types
export default ({ theme }) => {
	_theme = theme;
	return (
		<ScrollView style={{ backgroundColor: themes[theme].backgroundColor }}>

			<Separator title='Simple' theme={theme} />
			<Message msg='Message' />

			<Separator title='Long message' theme={theme} />
			<Message msg={longText} />

			<Separator title='Grouped messages' theme={theme} />
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

			<Separator title='Without header' theme={theme} />
			<Message msg='Message' isHeader={false} />

			<Separator title='With alias' theme={theme} />
			<Message msg='Message' alias='Diego Mello' />
			<Message
				msg='Message'
				author={{
					...author,
					username: longText
				}}
				alias='Diego Mello'
			/>

			<Separator title='Edited' theme={theme} />
			<Message msg='Message' edited />

			<Separator title='Encrypted' theme={theme} />
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
					usernames: [{ value: 'username' }]
				}, {
					emoji: ':marioparty:',
					usernames: [{ value: 'username' }]
				}, {
					emoji: ':thinking:',
					usernames: [{ value: 'username' }]
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

			<Separator title='Block Quote' theme={theme} />
			<Message msg='> Testing block quote' />
			<Message msg={'> Testing block quote\nTesting block quote'} />

			<Separator title='Lists' theme={theme} />
			<Message msg={'* Dogs\n  * cats\n  - cats'} />

			<Separator title='Numerated lists' theme={theme} />
			<Message msg={'1. Dogs \n 2. Cats'} />

			<Separator title='Numerated lists in separated messages' theme={theme} />
			<Message msg='1. Dogs' />
			<Message msg='2. Cats' isHeader={false} />

			<Separator title='Static avatar' theme={theme} />
			<Message
				msg='Message'
				avatar='https://pbs.twimg.com/profile_images/1016397063649660929/14EIApTi_400x400.jpg'
			/>

			<Separator title='Full name' theme={theme} />
			<Message
				msg='Message'
				author={{
					...author,
					username: 'diego.mello',
					name: 'Diego Mello'
				}}
				useRealName
			/>

			<Separator title='Mentions' theme={theme} />
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

			<Separator title='Emojis' theme={theme} />
			<Message msg='👊🤙👏' />

			<Separator title='Single Emoji' theme={theme} />
			<Message msg='👏' />

			<Separator title='Custom Emojis' theme={theme} />
			<Message msg=':react_rocket: :nyan_rocket: :marioparty:' />

			<Separator title='Single Custom Emojis' theme={theme} />
			<Message msg=':react_rocket:' />

			<Separator title='Normal Emoji + Custom Emojis' theme={theme} />
			<Message msg='🤙:react_rocket:' />

			<Separator title='Four emoji' theme={theme} />
			<Message msg='🤙:react_rocket:🤙🤙' />

			<Separator title='Time format' theme={theme} />
			<Message msg='Testing' timeFormat='DD MMMM YYYY' />

			<Separator title='Reactions' theme={theme} />
			<Message
				msg='Reactions'
				reactions={[{
					emoji: ':joy:',
					usernames: [{ value: 'username' }, { value: 'rocket.cat' }, { value: 'diego.mello' }]
				}, {
					emoji: ':marioparty:',
					usernames: [{ value: 'username' }, { value: 'rocket.cat' }, { value: 'diego.mello' }, { value: 'user1' }, { value: 'user1' }, { value: 'user1' }, { value: 'user1' }, { value: 'user1' }, { value: 'user1' }, { value: 'user1' }, { value: 'user1' }, { value: 'user1' }, { value: 'user1' }]
				}, {
					emoji: ':thinking:',
					usernames: [{ value: 'username' }]
				}]}
				onReactionPress={() => {}}
			/>

			<Separator title='Multiple reactions' theme={theme} />
			<Message
				msg='Multiple Reactions'
				reactions={[{
					emoji: ':marioparty:',
					usernames: [{ value: 'username' }]
				}, {
					emoji: ':react_rocket:',
					usernames: [{ value: 'username' }]
				}, {
					emoji: ':nyan_rocket:',
					usernames: [{ value: 'username' }]
				}, {
					emoji: ':heart:',
					usernames: [{ value: 'username' }]
				}, {
					emoji: ':dog:',
					usernames: [{ value: 'username' }]
				}, {
					emoji: ':grinning:',
					usernames: [{ value: 'username' }]
				}, {
					emoji: ':grimacing:',
					usernames: [{ value: 'username' }]
				}, {
					emoji: ':grin:',
					usernames: [{ value: 'username' }]
				}]}
				onReactionPress={() => {}}
			/>

			<Separator title='Intercalated users' theme={theme} />
			<Message
				msg='Fourth message'
				author={{
					...author,
					username: 'rocket.cat'
				}}
			/>
			<Message msg='Third message' />
			<Message
				msg='Second message'
				author={{
					...author,
					username: 'rocket.cat'
				}}
			/>
			<Message msg='First message' />

			<Separator title='Date and Unread separators' theme={theme} />
			<Message
				msg='Fourth message'
				author={{
					...author,
					username: 'rocket.cat'
				}}
			/>
			<MessageSeparator ts={date} unread theme={theme} />
			<Message msg='Third message' />
			<MessageSeparator unread theme={theme} />
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
			<MessageSeparator ts={date} theme={theme} />
			<Message msg='First message' />

			<Separator title='With image' theme={theme} />
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

			<Separator title='With video' theme={theme} />
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

			<Separator title='With audio' theme={theme} />
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

			<Separator title='With file' theme={theme} />
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

			<Separator title='Message with reply' theme={theme} />
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

			<Separator title='Message with read receipt' theme={theme} />
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

			<Separator title='Message with thread' theme={theme} />
			<Message
				msg='How are you?'
				tcount={1}
				tlm={date}
			/>
			<Message
				msg='How are you?'
				tcount={9999}
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
				tmsg='Markdown: [link](http://www.google.com/) ```block code```'
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

			<Separator title='Sequential thread messages following thread button' theme={theme} />
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

			<Separator title='Sequential thread messages following thread reply' theme={theme} />
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

			{/* <Message
				msg='How are you?'
				tcount={9999}
				tlm={moment().subtract(1, 'hour')}
			/>
			<Message
				msg='How are you?'
				tcount={9999}
				tlm={moment().subtract(1, 'day')}
			/>
			<Message
				msg='How are you?'
				tcount={9999}
				tlm={moment().subtract(5, 'day')}
			/>
			<Message
				msg='How are you?'
				tcount={9999}
				tlm={moment().subtract(30, 'day')}
			/> */}

			<Separator title='Discussion' theme={theme} />
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
			{/* <Message
				type='discussion-created'
				drid='aisduhasidhs'
				dcount={1000}
				dlm={moment().subtract(1, 'hour')}
				msg='This is a discussion'
			/>
			<Message
				type='discussion-created'
				drid='aisduhasidhs'
				dcount={1000}
				dlm={moment().subtract(1, 'day')}
				msg='This is a discussion'
			/>
			<Message
				type='discussion-created'
				drid='aisduhasidhs'
				dcount={1000}
				dlm={moment().subtract(5, 'day')}
				msg='This is a discussion'
			/>
			<Message
				type='discussion-created'
				drid='aisduhasidhs'
				dcount={1000}
				dlm={moment().subtract(30, 'day')}
				msg='This is a discussion'
			/> */}


			<Separator title='URL' theme={theme} />
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

			<Separator title='Custom fields' theme={theme} />
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

			<Separator title='Two short custom fields' theme={theme} />
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
						value: 'Value 2',
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
						value: 'Value 2',
						short: true
					}]
				}]}
			/>

			<Separator title='Broadcast' theme={theme} />
			<Message msg='Broadcasted message' broadcast replyBroadcast={() => alert('broadcast!')} />

			<Separator title='Archived' theme={theme} />
			<Message msg='This message is inside an archived room' archived />

			<Separator title='Error' theme={theme} />
			<Message hasError msg='This message has error' status={messagesStatus.ERROR} onErrorPress={() => alert('Error pressed')} />
			<Message hasError msg='This message has error too' status={messagesStatus.ERROR} onErrorPress={() => alert('Error pressed')} isHeader={false} />

			<Separator title='Temp' theme={theme} />
			<Message msg='Temp message' status={messagesStatus.TEMP} isTemp />

			<Separator title='Editing' theme={theme} />
			<Message msg='Message being edited' editing />

			<Separator title='Removed' theme={theme} />
			<Message type='rm' isInfo />

			<Separator title='Joined' theme={theme} />
			<Message type='uj' isInfo />

			<Separator title='Room name changed' theme={theme} />
			<Message msg='New name' type='r' isInfo />

			<Separator title='Message pinned' theme={theme} />
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

			<Separator title='Has left the channel' theme={theme} />
			<Message type='ul' isInfo />

			<Separator title='User removed' theme={theme} />
			<Message msg='rocket.cat' type='ru' isInfo />

			<Separator title='User added' theme={theme} />
			<Message msg='rocket.cat' type='au' isInfo />

			<Separator title='User muted' theme={theme} />
			<Message msg='rocket.cat' type='user-muted' isInfo />

			<Separator title='User unmuted' theme={theme} />
			<Message msg='rocket.cat' type='user-unmuted' isInfo />

			<Separator title='Role added' theme={theme} />
			<Message
				msg='rocket.cat'
				role='admin' // eslint-disable-line
				type='subscription-role-added'
				isInfo
			/>

			<Separator title='Role removed' theme={theme} />
			<Message
				msg='rocket.cat'
				role='admin' // eslint-disable-line
				type='subscription-role-removed'
				isInfo
			/>

			<Separator title='Changed description' theme={theme} />
			<Message msg='new description' type='room_changed_description' isInfo />

			<Separator title='Changed announcement' theme={theme} />
			<Message msg='new announcement' type='room_changed_announcement' isInfo />

			<Separator title='Changed topic' theme={theme} />
			<Message msg='new topic' type='room_changed_topic' isInfo />

			<Separator title='Changed type' theme={theme} />
			<Message msg='public' type='room_changed_privacy' isInfo />

			<Separator title='Custom style' theme={theme} />
			<Message msg='Message' style={[styles.normalize, { backgroundColor: '#ddd' }]} />

			<Separator title='Markdown emphasis' theme={theme} />
			<Message msg='Italic with single _underscore_ or double __underscores__. Bold with single *asterisk* or double **asterisks**. Strikethrough with single ~Strikethrough~ or double ~~Strikethrough~~' />

			<Separator title='Markdown headers' theme={theme} />
			<Message
				msg='# H1
## H2
### H3
#### H4
##### H5
###### H6'
			/>

			<Separator title='Markdown links' theme={theme} />
			<Message msg='Support <http://google.com|Google> [I`m an inline-style link](https://www.google.com) https://google.com' />

			<Separator title='Markdown image' theme={theme} />
			<Message msg='![alt text](https://play.google.com/intl/en_us/badges/images/badge_new.png)' />

			<Separator title='Markdown code' theme={theme} />
			<Message
				msg='Inline `code` has `back-ticks around` it.
```
Code block
```'
			/>

			<Separator title='Markdown quote' theme={theme} />
			<Message msg='> Quote' />

			<Separator title='Markdown table' theme={theme} />
			<Message
				msg='First Header | Second Header
------------ | -------------
Content from cell 1 | Content from cell 2
Content in the first column | Content in the second column'
			/>
		</ScrollView>
	);
};
