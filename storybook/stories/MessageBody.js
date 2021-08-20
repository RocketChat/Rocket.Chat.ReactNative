/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { storiesOf } from '@storybook/react-native';

import MessageBody from '../../app/containers/markdown/MessageBody';
import { themes } from '../../app/constants/colors';

const stories = storiesOf('MessageBody', module);

const theme = 'light';

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 15,
		backgroundColor: themes[theme].backgroundColor,
		marginVertical: 50
	},
	separator: {
		marginHorizontal: 10,
		marginVertical: 10
	}
});

const simpleTextMsg = [{
	type: 'PARAGRAPH',
	value: [{
		type: 'PLAIN_TEXT',
		value: 'This is Rocket.Chat'
	}]
}];

const longTextMsg = [{
	type: 'PARAGRAPH',
	value: [{
		type: 'PLAIN_TEXT',
		value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
	}]
}];

const lineBreakMsg = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'PLAIN_TEXT',
				value: 'a'
			},
			{
				type: 'PLAIN_TEXT',
				value: 'b'
			},
			{
				type: 'PLAIN_TEXT',
				value: 'c'
			},
			{
				type: 'PLAIN_TEXT',
				value: ''
			},
			{
				type: 'PLAIN_TEXT',
				value: 'd'
			},
			{
				type: 'PLAIN_TEXT',
				value: ''
			},
			{
				type: 'PLAIN_TEXT',
				value: ''
			},
			{
				type: 'PLAIN_TEXT',
				value: 'e'
			}
		]
	}
];

const sequentialEmptySpacesMsg = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'PLAIN_TEXT',
				value: 'a       b                                                                             c'
			}
		]
	}
];

const boldOrUnderscoreMsg = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'PLAIN_TEXT',
				value: 'Strong emphasis, aka bold, with '
			},
			{
				type: 'BOLD',
				value: [{
					type: 'PLAIN_TEXT',
					value: 'asterisks'
				}]
			},
			{
				type: 'PLAIN_TEXT',
				value: ' or '
			},
			{
				type: 'ITALIC',
				value: [{
					type: 'PLAIN_TEXT',
					value: 'underscore'
				}]
			}
		]
	}
];

stories.add('Text', () => (
	<View style={styles.container}>
		<MessageBody tokens={simpleTextMsg} />
		<MessageBody tokens={longTextMsg} />
		<MessageBody tokens={lineBreakMsg} />
		<MessageBody tokens={sequentialEmptySpacesMsg} />
		<MessageBody tokens={boldOrUnderscoreMsg} />
	</View>
));

const allMentionTokens = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'MENTION_USER',
				value: {
					type: 'PLAIN_TEXT',
					value: 'rocket.cat'
				}
			}
		]
	}
];

const multipleMentionTokens = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'MENTION_USER',
				value: {
					type: 'PLAIN_TEXT',
					value: 'name'
				}
			},
			{
				type: 'PLAIN_TEXT',
				value: ' '
			},
			{
				type: 'MENTION_USER',
				value: {
					type: 'PLAIN_TEXT',
					value: 'rocket.cat'
				}
			},
			{
				type: 'PLAIN_TEXT',
				value: ' '
			},
			{
				type: 'MENTION_USER',
				value: {
					type: 'PLAIN_TEXT',
					value: 'here'
				}
			},
			{
				type: 'PLAIN_TEXT',
				value: ' '
			},
			{
				type: 'MENTION_USER',
				value: {
					type: 'PLAIN_TEXT',
					value: 'all'
				}
			}
		]
	}
];

const allMentions = [
	{
		_id: 'rocket.cat',
		username: 'rocket.cat'
	}
];

const multipleMentions = [
	{
		_id: 'name',
		username: 'name'
	},
	{
		_id: 'rocket.cat',
		username: 'rocket.cat'
	},
	{
		_id: 'here',
		username: 'here'
	},
	{
		_id: 'all',
		username: 'all'
	}
];

stories.add('Mentions', () => (
	<View style={styles.container}>
		<MessageBody tokens={allMentionTokens} mentions={allMentions} navToRoomInfo={() => {}} style={[]} />
		<MessageBody tokens={multipleMentionTokens} mentions={multipleMentions} navToRoomInfo={() => {}} style={[]} />
	</View>
));

const channelTokens = [
	{
		type: 'PARAGRAPH',
		value: [{
			type: 'MENTION_CHANNEL',
			value: {
				type: 'PLAIN_TEXT',
				value: 'text_channel'
			}
		}]
	}
];

const channelMention = [
	{
		_id: 'text_channel',
		name: 'text_channel'
	}
];

stories.add('Hashtag', () => (
	<View style={styles.container}>
		<MessageBody tokens={channelTokens} channels={channelMention} navToRoomInfo={() => {}} />
	</View>
));

const bigEmojiTokens = [{
	type: 'BIG_EMOJI',
	value: [
		{
			type: 'EMOJI',
			value: {
				type: 'PLAIN_TEXT',
				value: 'green_heart'
			}
		}
	]
}];

const multipleBigEmojiTokens = [{
	type: 'BIG_EMOJI',
	value: [
		{
			type: 'EMOJI',
			value: {
				type: 'PLAIN_TEXT',
				value: 'green_heart'
			}
		},
		{
			type: 'EMOJI',
			value: {
				type: 'PLAIN_TEXT',
				value: 'joy'
			}
		},
		{
			type: 'EMOJI',
			value: {
				type: 'PLAIN_TEXT',
				value: 'grin'
			}
		}
	]
}];

const emojiTokens = [{
	type: 'PARAGRAPH',
	value: [
		{
			type: 'EMOJI',
			value: {
				type: 'PLAIN_TEXT',
				value: 'rocket'
			}
		},
		{
			type: 'EMOJI',
			value: {
				type: 'PLAIN_TEXT',
				value: 'facepalm'
			}
		}
	]
}];

stories.add('Emoji', () => (
	<View style={styles.container}>
		<MessageBody tokens={bigEmojiTokens} />
		<MessageBody tokens={multipleBigEmojiTokens} />
		<MessageBody tokens={emojiTokens} />
	</View>
));

const blockQuoteTokens = [{
	type: 'QUOTE',
	value: [{
		type: 'PARAGRAPH',
		value: [{
			type: 'PLAIN_TEXT',
			value: 'Rocket.Chat to the moon'
		}]
	}]

}];

stories.add('Block quote', () => (
	<View style={styles.container}>
		<MessageBody tokens={blockQuoteTokens} />
	</View>
));

const rocketChatLink = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'LINK',
				value: {
					src: {
						type: 'PLAIN_TEXT',
						value: 'https://rocket.chat'
					},
					label: {
						type: 'PLAIN_TEXT',
						value: 'https://rocket.chat'
					}
				}
			}
		]
	}
];

const markdownLink = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'LINK',
				value: {
					src: {
						type: 'PLAIN_TEXT',
						value: 'https://rocket.chat'
					},
					label: {
						type: 'PLAIN_TEXT',
						value: 'Markdown link'
					}
				}
			}
		]
	}
];

stories.add('Links', () => (
	<View style={styles.container}>
		<MessageBody tokens={rocketChatLink} />
		<MessageBody tokens={markdownLink} />
	</View>
));

stories.add('Headers', () => (
	<View style={styles.container}>
		<MessageBody
			tokens={
				[
					{
						type: 'HEADING',
						value: [{
							type: 'PLAIN_TEXT',
							value: '# Header 1'
						}],
						level: 1
					}
				]
			}
		/>
		<MessageBody
			tokens={
				[
					{
						type: 'HEADING',
						value: [{
							type: 'PLAIN_TEXT',
							value: '## Header 2'
						}],
						level: 2
					}
				]
			}
		/>
		<MessageBody
			tokens={
				[
					{
						type: 'HEADING',
						value: [{
							type: 'PLAIN_TEXT',
							value: '### Header 3'
						}],
						level: 3
					}
				]
			}
		/>
		<MessageBody
			tokens={
				[
					{
						type: 'HEADING',
						value: [{
							type: 'PLAIN_TEXT',
							value: '#### Header 4'
						}],
						level: 4
					}
				]
			}
		/>
		<MessageBody
			tokens={
				[
					{
						type: 'HEADING',
						value: [{
							type: 'PLAIN_TEXT',
							value: '##### Header 5'
						}],
						level: 5
					}
				]
			}
		/>
		<MessageBody
			tokens={
				[
					{
						type: 'HEADING',
						value: [{
							type: 'PLAIN_TEXT',
							value: '###### Header 6'
						}],
						level: 6
					}
				]
			}
		/>
	</View>
));

const unorederedListToken = [
	{
		type: 'UNORDERED_LIST',
		value: [
			{
				type: 'LIST_ITEM',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'Open Source'
					}
				]
			},
			{
				type: 'LIST_ITEM',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'Rocket.Chat'
					}
				]
			}
		]
	}
];

const orderedListToken = [
	{
		type: 'ORDERED_LIST',
		value: [
			{
				type: 'LIST_ITEM',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'Open Source'
					}
				]
			},
			{
				type: 'LIST_ITEM',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'Rocket.Chat'
					}
				]
			}
		]
	}
];

stories.add('Lists', () => (
	<View style={styles.container}>
		<MessageBody tokens={unorederedListToken} />
		<MessageBody tokens={orderedListToken} />
	</View>
));
