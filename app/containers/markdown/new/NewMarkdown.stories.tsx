import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import NewMarkdownComponent from '.';
import { colors, themes } from '../../../lib/constants';
import { longText } from '../../../../.storybook/utils';
import { ThemeContext } from '../../../theme';

const theme = 'light';

export default {
	title: 'NewMarkdown',
	decorators: [
		(Story: any) => (
			<NavigationContainer>
				<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
					<Story />
				</ThemeContext.Provider>
			</NavigationContainer>
		)
	]
};

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 15,
		backgroundColor: themes[theme].backgroundColor,
		marginVertical: 50
	}
});

const getCustomEmoji = (content: string) => {
	const customEmoji = {
		marioparty: { name: content, extension: 'gif' },
		nyan_rocket: { name: content, extension: 'png' }
	}[content];
	return customEmoji;
};

const NewMarkdown = ({ ...props }) => <NewMarkdownComponent getCustomEmoji={getCustomEmoji} username='rocket.cat' {...props} />;

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
				value: longText
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

export const Text = () => (
	<View style={styles.container}>
		<NewMarkdown tokens={simpleTextMsg} />
		<NewMarkdown tokens={longTextMsg} />
		<NewMarkdown tokens={lineBreakMsg} />
		<NewMarkdown tokens={sequentialEmptySpacesMsg} />
		<NewMarkdown tokens={[...simpleTextMsg, ...longTextMsg]} />
	</View>
);

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
					value: 'not_a_user'
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

export const Mentions = () => (
	<View style={styles.container}>
		<NewMarkdown tokens={allMentionTokens} mentions={allMentions} navToRoomInfo={() => {}} style={[]} />
		<NewMarkdown tokens={multipleMentionTokens} mentions={multipleMentions} navToRoomInfo={() => {}} style={[]} />
	</View>
);

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

export const Hashtag = () => (
	<View style={styles.container}>
		<NewMarkdown tokens={channelTokens} channels={channelMention} navToRoomInfo={() => {}} />
	</View>
);

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

export const Emoji = () => (
	<View style={styles.container}>
		<NewMarkdown tokens={bigEmojiTokens} />
		<NewMarkdown tokens={emojiTokens} getCustomEmoji={getCustomEmoji} />
	</View>
);

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
	},
	{
		type: 'QUOTE',
		value: [
			{
				type: 'PARAGRAPH',
				value: [
					{
						type: 'PLAIN_TEXT',
						value: longText
					}
				]
			}
		]
	}
];

export const BlockQuote = () => (
	<View style={styles.container}>
		<NewMarkdown tokens={blockQuoteTokens} />
	</View>
);

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

const markdownLinkWithEmphasis = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'LINK',
				value: {
					src: {
						type: 'PLAIN_TEXT',
						value: 'https://rocket.chat/'
					},
					label: [
						{
							type: 'PLAIN_TEXT',
							value: 'Normal Link - '
						},
						{
							type: 'BOLD',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'Bold'
								}
							]
						},
						{
							type: 'PLAIN_TEXT',
							value: ' '
						},
						{
							type: 'STRIKE',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'strike'
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
									value: 'Italic'
								}
							]
						},
						{
							type: 'PLAIN_TEXT',
							value: ' Styles'
						}
					]
				}
			}
		]
	}
];

export const Links = () => (
	<View style={styles.container}>
		<NewMarkdown tokens={rocketChatLink} />
		<NewMarkdown tokens={markdownLink} />
		<NewMarkdown tokens={markdownLinkWithEmphasis} />
	</View>
);

export const Headers = () => (
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
);

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
					value: 'Multi \nLine \nCode'
				}
			}
		]
	}
];

export const Code = () => (
	<View style={styles.container}>
		<NewMarkdown tokens={inlineCodeToken} style={[]} />
		<NewMarkdown tokens={multilineCodeToken} style={[]} />
	</View>
);

const items = [
	[
		{
			type: 'PLAIN_TEXT',
			value: 'Plain text '
		},
		{
			type: 'EMOJI',
			value: {
				type: 'PLAIN_TEXT',
				value: 'bulb'
			}
		},
		{
			type: 'ITALIC',
			value: [
				{
					type: 'PLAIN_TEXT',
					value: ' italic '
				}
			]
		},
		{
			type: 'BOLD',
			value: [
				{
					type: 'PLAIN_TEXT',
					value: ' bold '
				}
			]
		},
		{
			type: 'STRIKE',
			value: [
				{
					type: 'PLAIN_TEXT',
					value: ' strike '
				}
			]
		},
		{
			type: 'MENTION_CHANNEL',
			value: {
				type: 'PLAIN_TEXT',
				value: 'general'
			}
		},
		{
			type: 'LINK',
			value: {
				src: {
					type: 'PLAIN_TEXT',
					value: 'https://google.com'
				},
				label: {
					type: 'PLAIN_TEXT',
					value: ' link '
				}
			}
		},
		{
			type: 'MENTION_USER',
			value: {
				type: 'PLAIN_TEXT',
				value: 'rocket.cat'
			}
		},
		{
			type: 'INLINE_CODE',
			value: {
				type: 'PLAIN_TEXT',
				value: ' inline code'
			}
		}
	],
	[
		{
			type: 'PLAIN_TEXT',
			value: longText
		}
	]
];

const listItems = [
	{
		type: 'LIST_ITEM',
		value: items[0]
	},
	{
		type: 'LIST_ITEM',
		value: items[1]
	}
];

const unorederedListToken = [
	{
		type: 'UNORDERED_LIST',
		value: listItems
	}
];

const orderedListToken = [
	{
		type: 'ORDERED_LIST',
		value: listItems
	}
];

const listMentions = [
	{
		_id: 'rocket.cat',
		username: 'rocket.cat'
	}
];

const listChannels = [
	{
		_id: 'general',
		name: 'general'
	}
];

const tasks = [
	{
		type: 'TASKS',
		value: [
			{
				type: 'TASK',
				status: true,
				value: items[0]
			},
			{
				type: 'TASK',
				status: false,
				value: items[1]
			}
		]
	}
];

export const Lists = () => (
	<View style={styles.container}>
		<NewMarkdown tokens={unorederedListToken} mentions={listMentions} channels={listChannels} />
		<NewMarkdown tokens={orderedListToken} mentions={listMentions} channels={listChannels} />
		<NewMarkdown tokens={tasks} mentions={listMentions} channels={listChannels} />
	</View>
);

const katex = [
	{
		type: 'KATEX',
		value: ' f(x) = \\int_{-\\infty}^\\infty \\hat f(\\xi)\\,e^{2 \\pi i \\xi x} \\,d\\xi '
	}
];

const inlineKatex = [
	{
		type: 'PARAGRAPH',
		value: [
			{
				type: 'INLINE_KATEX',
				value: 'This text includes math notations and should be wrapped correctly for $\\alpha$ and $\\beta$ within the view.'
			},
			{
				type: 'INLINE_KATEX',
				value: "The following formula shouldn't be inline:$$x_{1,2} = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}$$"
			},
			{
				type: 'INLINE_KATEX',
				value: 'However the following formula should be inline with the text: \\( a^2 + b^2 = c^2 \\)'
			}
		]
	}
];

export const Katex = () => (
	<View style={styles.container}>
		<NewMarkdown tokens={katex} />
	</View>
);

export const InlineKatex = () => (
	<View style={styles.container}>
		<NewMarkdown tokens={inlineKatex} />
	</View>
);
