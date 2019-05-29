import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
// import moment from 'moment';

import MessageComponent from '../../app/containers/message/Message';
import StoriesSeparator from './StoriesSeparator';
import messagesStatus from '../../app/constants/messagesStatus';
import MessageSeparator from '../../app/views/RoomView/Separator';

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
const customEmojis = { react_rocket: 'png', nyan_rocket: 'png', marioparty: 'gif' };
const date = new Date(2017, 10, 10, 10);
const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const Message = props => (
	<MessageComponent
		baseUrl={baseUrl}
		customEmojis={customEmojis}
		user={user}
		author={author}
		ts={date}
		timeFormat='LT'
		header
		{...props}
	/>
);

// eslint-disable-next-line react/prop-types
const Separator = ({ title }) => <StoriesSeparator title={title} style={styles.separator} />;

export default (
	<ScrollView style={{ flex: 1 }} contentContainerStyle={{ marginVertical: 30 }}>

		<Separator title='Simple' />
		<Message msg='Message' />

		<Separator title='Long message' />
		<Message msg={longText} />

		<Separator title='Grouped messages' />
		<Message msg='...' />
		<Message
			msg='Different user'
			author={{
				...author,
				username: longText
			}}
		/>
		<Message msg='This is the third message' header={false} />
		<Message msg='This is the second message' header={false} />
		<Message msg='This is the first message' />

		<Separator title='Without header' />
		<Message msg='Message' header={false} />

		<Separator title='With alias' />
		<Message msg='Message' alias='Diego Mello' />
		<Message
			msg='Message'
			author={{
				...author,
				username: longText
			}}
			alias='Diego Mello'
		/>

		<Separator title='Edited' />
		<Message msg='Message' edited />

		<Separator title='Static avatar' />
		<Message
			msg='Message'
			avatar='https://pbs.twimg.com/profile_images/1016397063649660929/14EIApTi_400x400.jpg'
		/>

		<Separator title='Full name' />
		<Message
			msg='Message'
			author={{
				...author,
				username: 'diego.mello',
				name: 'Diego Mello'
			}}
			useRealName
		/>

		<Separator title='Mentions' />
		<Message msg='@rocket.cat @diego.mello @all @here #general' />

		<Separator title='Emojis' />
		<Message msg='👊🤙👏' />

		<Separator title='Custom Emojis' />
		<Message msg=':react_rocket: :nyan_rocket: :marioparty:' />

		<Separator title='Time format' />
		<Message msg='Testing' timeFormat='DD MMMM YYYY' />

		<Separator title='Reactions' />
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

		<Separator title='Multiple reactions' />
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

		<Separator title='Intercalated users' />
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

		<Separator title='Date and Unread separators' />
		<Message
			msg='Fourth message'
			author={{
				...author,
				username: 'rocket.cat'
			}}
		/>
		<MessageSeparator ts={date} unread />
		<Message msg='Third message' />
		<MessageSeparator unread />
		<Message
			msg='Second message'
			author={{
				...author,
				username: 'rocket.cat'
			}}
			header={false}
		/>
		<Message
			msg='Second message'
			author={{
				...author,
				username: 'rocket.cat'
			}}
		/>
		<MessageSeparator ts={date} />
		<Message msg='First message' />

		<Separator title='With image' />
		<Message
			attachments={[{
				title: 'This is a title',
				description: 'This is a description',
				image_url: '/file-upload/2ZrxuwcGeTrsoh376/Clipboard%20-%20September%205,%202018%204:10%20PM'
			}]}
		/>
		<Message
			attachments={[{
				title: 'This is a title',
				description: 'This is a description',
				image_url: '/file-upload/sxLXBzjwuqxMnebyP/Clipboard%20-%2029%20de%20Agosto%20de%202018%20%C3%A0s%2018:10'
			}]}
		/>

		<Separator title='With video' />
		<Message
			attachments={[{
				title: 'This is a title',
				description: 'This is a description',
				video_url: '/file-upload/cqnKqb6kdajky5Rxj/WhatsApp%20Video%202018-08-22%20at%2019.09.55.mp4'
			}]}
		/>

		<Separator title='With audio' />
		<Message
			attachments={[{
				title: 'This is a title',
				description: 'This is a description',
				audio_url: '/file-upload/c4wcNhrbXJLBvAJtN/1535569819516.aac'
			}]}
		/>
		<Message msg='First message' header={false} />
		<Message
			attachments={[{
				title: 'This is a title',
				description: 'This is a description',
				audio_url: '/file-upload/c4wcNhrbXJLBvAJtN/1535569819516.aac'
			}]}
			header={false}
		/>
		<Message
			attachments={[{
				title: 'This is a title',
				audio_url: '/file-upload/c4wcNhrbXJLBvAJtN/1535569819516.aac'
			}]}
			header={false}
		/>
		<Message
			attachments={[{
				title: 'This is a title',
				audio_url: '/file-upload/c4wcNhrbXJLBvAJtN/1535569819516.aac'
			}]}
			header={false}
		/>

		<Separator title='Message with reply' />
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
				text: 'How are you?'
			}]}
		/>

		<Separator title='Message with thread' />
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
				description: 'This is a description',
				audio_url: '/file-upload/c4wcNhrbXJLBvAJtN/1535569819516.aac'
			}]}
			isThreadReply
		/>

		<Separator title='Sequential thread messages following thread button' />
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

		<Separator title='Sequential thread messages following thread reply' />
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

		<Separator title='Discussion' />
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


		<Separator title='URL' />
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

		<Separator title='Custom fields' />
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

		<Separator title='Two short custom fields' />
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

		<Separator title='Broadcast' />
		<Message msg='Broadcasted message' broadcast replyBroadcast={() => alert('broadcast!')} />

		<Separator title='Archived' />
		<Message msg='This message is inside an archived room' archived />

		<Separator title='Error' />
		<Message msg='This message has error too' status={messagesStatus.ERROR} onErrorPress={() => alert('Error pressed')} header={false} />
		<Message msg='This message has error' status={messagesStatus.ERROR} onErrorPress={() => alert('Error pressed')} />

		<Separator title='Temp' />
		<Message msg='Temp message' status={messagesStatus.TEMP} />

		<Separator title='Editing' />
		<Message msg='Message being edited' editing />

		<Separator title='Removed' />
		<Message type='rm' />

		<Separator title='Joined' />
		<Message type='uj' />

		<Separator title='Room name changed' />
		<Message msg='New name' type='r' />

		<Separator title='Message pinned' />
		<Message
			msg='New name'
			type='message_pinned'
			attachments={[{
				author_name: 'rocket.cat',
				ts: date,
				timeFormat: 'LT',
				text: 'First message'
			}]}
		/>

		<Separator title='Has left the channel' />
		<Message type='ul' />

		<Separator title='User removed' />
		<Message msg='rocket.cat' type='ru' />

		<Separator title='User added' />
		<Message msg='rocket.cat' type='au' />

		<Separator title='User muted' />
		<Message msg='rocket.cat' type='user-muted' />

		<Separator title='User unmuted' />
		<Message msg='rocket.cat' type='user-unmuted' />

		<Separator title='Role added' />
		<Message
			msg='rocket.cat'
			role='admin' // eslint-disable-line
			type='subscription-role-added'
		/>

		<Separator title='Role removed' />
		<Message
			msg='rocket.cat'
			role='admin' // eslint-disable-line
			type='subscription-role-removed'
		/>

		<Separator title='Changed description' />
		<Message msg='new description' type='room_changed_description' />

		<Separator title='Changed announcement' />
		<Message msg='new announcement' type='room_changed_announcement' />

		<Separator title='Changed topic' />
		<Message msg='new topic' type='room_changed_topic' />

		<Separator title='Changed type' />
		<Message msg='public' type='room_changed_privacy' />

		<Separator title='Custom style' />
		<Message msg='Message' style={[styles.normalize, { backgroundColor: '#ddd' }]} />

		<Separator title='Markdown emphasis' />
		<Message msg='Italic with *asterisks* or _underscores_. Bold with **asterisks** or __underscores__. ~~Strikethrough~~' />

		<Separator title='Markdown headers' />
		<Message
			msg='# H1
## H2
### H3
#### H4
##### H5
###### H6'
		/>

		<Separator title='Markdown links' />
		<Message msg='Support <http://google.com|Google> [I`m an inline-style link](https://www.google.com) https://google.com' />

		<Separator title='Markdown image' />
		<Message msg='![alt text](https://play.google.com/intl/en_us/badges/images/badge_new.png)' />

		<Separator title='Markdown code' />
		<Message
			msg='Inline `code` has `back-ticks around` it.
```
Code block
```'
		/>

		<Separator title='Markdown quote' />
		<Message msg='> Quote' />

		<Separator title='Markdown table' />
		<Message
			msg='First Header | Second Header
------------ | -------------
Content from cell 1 | Content from cell 2
Content in the first column | Content in the second column'
		/>
	</ScrollView>
);
