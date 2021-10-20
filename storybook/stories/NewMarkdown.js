/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { storiesOf } from '@storybook/react-native';

import NewMarkdown from '../../app/containers/markdown/new';
import { themes } from '../../app/constants/colors';

const stories = storiesOf('NewMarkdown', module);

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

const getCustomEmoji = content => {
	const customEmoji = {
		marioparty: { name: content, extension: 'gif' },
		nyan_rocket: { name: content, extension: 'png' }
	}[content];
	return customEmoji;
};
const baseUrl = 'https://open.rocket.chat';

const simpleTextMsg = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'PLAIN_TEXT',
				value: 'This is Rocket.Chat'
			}
		]
	}
];

const longTextMsg = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'PLAIN_TEXT',
				value:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
			}
		]
	}
];

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
				type: 'BOLD',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'This is bold'
					}
				]
			},
			{
				type: 'PLAIN_TEXT',
				value: ' and '
			},
			{
				type: 'ITALIC',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'this is italic'
					}
				]
			}
		]
	}
];

stories.add('Text', () => (
	<View style={styles.container}>
		<NewMarkdown tokens={simpleTextMsg} />
		<NewMarkdown tokens={longTextMsg} />
		<NewMarkdown tokens={lineBreakMsg} />
		<NewMarkdown tokens={sequentialEmptySpacesMsg} />
		<NewMarkdown tokens={boldOrUnderscoreMsg} />
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
		<NewMarkdown tokens={allMentionTokens} mentions={allMentions} navToRoomInfo={() => {}} style={[]} />
		<NewMarkdown
			tokens={multipleMentionTokens}
			mentions={multipleMentions}
			navToRoomInfo={() => {}}
			style={[]}
			username='rocket.cat'
		/>
	</View>
));

const channelTokens = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'MENTION_CHANNEL',
				value: {
					type: 'PLAIN_TEXT',
					value: 'text_channel'
				}
			},
			{
				type: 'PLAIN_TEXT',
				value: ' and '
			},
			{
				type: 'MENTION_CHANNEL',
				value: {
					type: 'PLAIN_TEXT',
					value: 'not_a_channel'
				}
			}
		]
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
		<NewMarkdown tokens={channelTokens} channels={channelMention} navToRoomInfo={() => {}} />
	</View>
));

const bigEmojiTokens = [
	{
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
	}
];

const emojiTokens = [
	{
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
			},
			{
				type: 'EMOJI',
				value: {
					type: 'PLAIN_TEXT',
					value: 'nyan_rocket'
				}
			},
			{
				type: 'EMOJI',
				value: {
					type: 'PLAIN_TEXT',
					value: 'marioparty'
				}
			}
		]
	}
];

stories.add('Emoji', () => (
	<View style={styles.container}>
		<NewMarkdown tokens={bigEmojiTokens} />
		<NewMarkdown tokens={emojiTokens} getCustomEmoji={getCustomEmoji} baseUrl={baseUrl} />
	</View>
));

const blockQuoteTokens = [
	{
		type: 'QUOTE',
		value: [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: 'Rocket.Chat to the moon'
					}
				]
			}
		]
	}
];

stories.add('Block quote', () => (
	<View style={styles.container}>
		<NewMarkdown tokens={blockQuoteTokens} />
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
		<NewMarkdown tokens={rocketChatLink} />
		<NewMarkdown tokens={markdownLink} />
	</View>
));

stories.add('Headers', () => (
	<View style={styles.container}>
		<NewMarkdown
			tokens={[
				{
					type: 'HEADING',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '# Header 1'
						}
					],
					level: 1
				}
			]}
		/>
		<NewMarkdown
			tokens={[
				{
					type: 'HEADING',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '## Header 2'
						}
					],
					level: 2
				}
			]}
		/>
		<NewMarkdown
			tokens={[
				{
					type: 'HEADING',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '### Header 3'
						}
					],
					level: 3
				}
			]}
		/>
		<NewMarkdown
			tokens={[
				{
					type: 'HEADING',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '#### Header 4'
						}
					],
					level: 4
				}
			]}
		/>
		<NewMarkdown
			tokens={[
				{
					type: 'HEADING',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '##### Header 5'
						}
					],
					level: 5
				}
			]}
		/>
		<NewMarkdown
			tokens={[
				{
					type: 'HEADING',
					value: [
						{
							type: 'PLAIN_TEXT',
							value: '###### Header 6'
						}
					],
					level: 6
				}
			]}
		/>
	</View>
));

const inlineCodeToken = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'INLINE_CODE',
				value: {
					type: 'PLAIN_TEXT',
					value: 'inline code'
				}
			}
		]
	}
];

const multilineCodeToken = [
	{
		type: 'CODE',
		language: 'none',
		value: [
			{
				type: 'CODE_LINE',
				value: {
					type: 'PLAIN_TEXT',
					value: 'Multi line '
				}
			},
			{
				type: 'CODE_LINE',
				value: {
					type: 'PLAIN_TEXT',
					value: 'Code'
				}
			}
		]
	}
];

stories.add('Code', () => (
	<View style={styles.container}>
		<NewMarkdown tokens={inlineCodeToken} style={[]} />
		<NewMarkdown tokens={multilineCodeToken} style={[]} />
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
		<NewMarkdown tokens={unorederedListToken} />
		<NewMarkdown tokens={orderedListToken} />
	</View>
));
