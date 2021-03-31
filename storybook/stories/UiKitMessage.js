/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { storiesOf } from '@storybook/react-native';
import MessageContext from '../../app/containers/message/Context';

import { UiKitMessage } from '../../app/containers/UIKit';
import { themes } from '../../app/constants/colors';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff'
	},
	padding: {
		paddingHorizontal: 16
	}
});

const user = {
	id: 'y8bd77ptZswPj3EW8',
	username: 'diego.mello',
	token: '79q6lH40W4ZRGLOshDiDiVlQaCc4f_lU9HNdHLAzuHz'
};

const baseUrl = 'https://open.rocket.chat';

const messageDecorator = story => (
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

const stories = storiesOf('UiKitMessage', module)
	.addDecorator(story => <SafeAreaView style={styles.container}>{story()}</SafeAreaView>)
	.addDecorator(story => <ScrollView style={[styles.container, styles.padding]} keyboardShouldPersistTaps='always'>{story()}</ScrollView>)
	.addDecorator(messageDecorator);

const Section = () => UiKitMessage([{
	type: 'section',
	text: {
		type: 'mrkdwn',
		text: 'Section'
	}
}]);
stories.add('Section', () => <Section />);

const SectionMarkdownList = () => UiKitMessage([{
	type: 'section',
	text: {
		type: 'mrkdwn',
		text: '*List*:\n1. Item'
	}
}]);
stories.add('Section + Markdown List', () => <SectionMarkdownList />);

const SectionOverflow = () => UiKitMessage([
	{
		type: 'section',
		text: {
			type: 'mrkdwn',
			text: 'Section + Overflow'
		},
		accessory: {
			type: 'overflow',
			options: [
				{
					text: {
						type: 'plain_text',
						text: 'Option 1',
						emoji: true
					},
					value: 'value-0'
				},
				{
					text: {
						type: 'plain_text',
						text: 'Option 2',
						emoji: true
					},
					value: 'value-1'
				},
				{
					text: {
						type: 'plain_text',
						text: 'Option 3',
						emoji: true
					},
					value: 'value-2'
				},
				{
					text: {
						type: 'plain_text',
						text: 'Option 4',
						emoji: true
					},
					value: 'value-3'
				}
			]
		}
	}
]);
stories.add('Section + Overflow', () => <SectionOverflow />);

const SectionImage = () => UiKitMessage([{
	type: 'section',
	text: {
		type: 'mrkdwn',
		text: 'Section + Image'
	},
	accessory: {
		type: 'image',
		imageUrl: 'https://raw.githubusercontent.com/RocketChat/Rocket.Chat.Artwork/master/Logos/icon-circle-256.png',
		altText: 'plants'
	}
}]);
stories.add('Section + image', () => <SectionImage />);

const SectionButton = () => UiKitMessage([{
	type: 'section',
	text: {
		type: 'mrkdwn',
		text: 'Section + button'
	},
	accessory: {
		type: 'button',
		text: {
			type: 'plain_text',
			text: 'button'
		}
	}
}]);
stories.add('Section + button', () => <SectionButton />);

const SectionSelect = () => UiKitMessage([{
	type: 'section',
	text: {
		type: 'mrkdwn',
		text: 'Section + select'
	},
	accessory: {
		type: 'static_select',
		options: [
			{
				value: 1,
				text: {
					type: 'plain_text',
					text: 'button'
				}
			}, {
				value: 2,
				text: {
					type: 'plain_text',
					text: 'second button'
				}
			}]
	}
}]);
stories.add('Section + Select', () => <SectionSelect />);

const SectionDatePicker = () => UiKitMessage([{
	type: 'section',
	text: {
		type: 'mrkdwn',
		text: 'Section + DatePicker'
	},
	accessory: {
		type: 'datepicker',
		initial_date: '1990-04-28',
		placeholder: {
			type: 'plain_text',
			text: 'Select a date',
			emoji: true
		}
	}
}]);
stories.add('Section + DatePicker', () => <SectionDatePicker />);

const SectionMultiSelect = () => UiKitMessage([{
	type: 'section',
	text: {
		type: 'mrkdwn',
		text: 'Section + select'
	},
	accessory: {
		type: 'multi_static_select',
		options: [{
			text: {
				type: 'plain_text',
				text: 'button'
			},
			value: 1
		}, {
			text: {
				type: 'plain_text',
				text: 'opt 1'
			},
			value: 2
		}, {
			text: {
				type: 'plain_text',
				text: 'opt 2'
			},
			value: 3
		}, {
			text: {
				type: 'plain_text',
				text: 'opt 3'
			},
			value: 4
		}]
	}
}]);
stories.add('Section + Multi Select', () => <SectionMultiSelect />);

const Image = () => UiKitMessage([{
	type: 'image',
	title: {
		type: 'plain_text',
		text: 'Example Image',
		emoji: true
	},
	imageUrl: 'https://raw.githubusercontent.com/RocketChat/Rocket.Chat.Artwork/master/Logos/icon-circle-256.png',
	altText: 'Example Image'
}]);
stories.add('Image', () => <Image />);

const Context = () => UiKitMessage([{
	type: 'context',
	elements: [{
		type: 'image',
		title: {
			type: 'plain_text',
			text: 'Example Image',
			emoji: true
		},
		imageUrl: 'https://raw.githubusercontent.com/RocketChat/Rocket.Chat.Artwork/master/Logos/icon-circle-256.png',
		altText: 'Example Image'
	},
	{
		type: 'mrkdwn',
		text: 'context'
	}
	]
}]);
stories.add('Context', () => <Context />);

const ActionButton = () => UiKitMessage([{
	type: 'actions',
	elements: [
		{
			type: 'button',
			text: {
				type: 'plain_text',
				emoji: true,
				text: 'Approve'
			},
			style: 'primary',
			value: 'click_me_123'
		},
		{
			type: 'button',
			text: {
				type: 'plain_text',
				emoji: true,
				text: 'Deny'
			},
			style: 'danger',
			value: 'click_me_123'
		},
		{
			type: 'button',
			text: {
				type: 'plain_text',
				emoji: true,
				text: 'Deny'
			},
			style: 'danger',
			value: 'click_me_123'
		},
		{
			type: 'button',
			text: {
				type: 'plain_text',
				emoji: true,
				text: 'Deny'
			},
			style: 'danger',
			value: 'click_me_123'
		},
		{
			type: 'button',
			text: {
				type: 'plain_text',
				emoji: true,
				text: 'Deny'
			},
			style: 'danger',
			value: 'click_me_123'
		},
		{
			type: 'button',
			text: {
				type: 'plain_text',
				emoji: true,
				text: 'Deny'
			},
			style: 'danger',
			value: 'click_me_123'
		},
		{
			type: 'button',
			text: {
				type: 'plain_text',
				emoji: true,
				text: 'Deny'
			},
			style: 'danger',
			value: 'click_me_123'
		}
	]
}]);
stories.add('Action - Buttons', () => <ActionButton />);

const Fields = () => UiKitMessage([
	{
		type: 'section',
		fields: [
			{
				type: 'plain_text',
				text: '*this is plain_text text*',
				emoji: true
			},
			{
				type: 'plain_text',
				text: '*this is plain_text text*',
				emoji: true
			},
			{
				type: 'plain_text',
				text: '*this is plain_text text*',
				emoji: true
			},
			{
				type: 'plain_text',
				text: '*this is plain_text text*',
				emoji: true
			},
			{
				type: 'plain_text',
				text: '*this is plain_text text*',
				emoji: true
			}
		]
	}]);
stories.add('Fields', () => <Fields />);

const ActionSelect = () => UiKitMessage([{
	type: 'actions',
	elements: [
		{
			type: 'conversations_select',
			placeholder: {
				type: 'plain_text',
				text: 'Select a conversation',
				emoji: true
			}
		},
		{
			type: 'channels_select',
			placeholder: {
				type: 'plain_text',
				text: 'Select a channel',
				emoji: true
			}
		},
		{
			type: 'users_select',
			placeholder: {
				type: 'plain_text',
				text: 'Select a user',
				emoji: true
			}
		},
		{
			type: 'static_select',
			placeholder: {
				type: 'plain_text',
				text: 'Select an item',
				emoji: true
			},
			options: [
				{
					text: {
						type: 'plain_text',
						text: 'Excellent item 1',
						emoji: true
					},
					value: 'value-0'
				},
				{
					text: {
						type: 'plain_text',
						text: 'Fantastic item 2',
						emoji: true
					},
					value: 'value-1'
				},
				{
					text: {
						type: 'plain_text',
						text: 'Nifty item 3',
						emoji: true
					},
					value: 'value-2'
				},
				{
					text: {
						type: 'plain_text',
						text: 'Pretty good item 4',
						emoji: true
					},
					value: 'value-3'
				}
			]
		}
	]
}]);
stories.add('Action - Select', () => <ActionSelect />);

// stories.add('Section', () => UiKitMessage([{
// 	type: 'section',
// 	text: {
// 		type: 'mrkdwn',
// 		text: 'Section'
// 	}
// }]));
