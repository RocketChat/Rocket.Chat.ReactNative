import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import MessageContext from '../message/Context';
import { UiKitMessage } from '.';
import { themes } from '../../lib/constants';

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
	token: 'abc'
};

const baseUrl = 'https://open.rocket.chat';

export default {
	title: 'UIKit/UiKitMessage',
	decorators: [
		(Story: any) => (
			<ScrollView style={[styles.container, styles.padding]} keyboardShouldPersistTaps='always'>
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
						threadBadgeColor: themes.light.fontInfo
					}}
				>
					<Story />
				</MessageContext.Provider>
			</ScrollView>
		)
	]
};

export const Section = () =>
	UiKitMessage([
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: 'Section'
			}
		}
	]);

export const SectionMarkdownList = () =>
	UiKitMessage([
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: '*List*:\n1. Item'
			}
		}
	]);
SectionMarkdownList.storyName = 'Section + Markdown List';

export const SectionOverflow = () =>
	UiKitMessage([
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
SectionOverflow.storyName = 'Section + Overflow';

export const SectionImage = () =>
	UiKitMessage([
		{
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
		}
	]);
SectionImage.storyName = 'Section + image';

export const SectionButton = () =>
	UiKitMessage([
		{
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
		}
	]);
SectionButton.storyName = 'Section + button';

export const SectionSelect = () =>
	UiKitMessage([
		{
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
					},
					{
						value: 2,
						text: {
							type: 'plain_text',
							text: 'second button'
						}
					}
				]
			}
		}
	]);
SectionSelect.storyName = 'Section + Select';

export const SectionDatePicker = () =>
	UiKitMessage([
		{
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
		}
	]);
SectionDatePicker.storyName = 'Section + DatePicker';

export const SectionMultiSelect = () =>
	UiKitMessage([
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: 'Section + select'
			},
			accessory: {
				type: 'multi_static_select',
				appId: 'app-id',
				blockId: 'block-id',
				actionId: 'action-id',
				initialValue: ['option_1', 'option_2'],
				options: [
					{
						value: 'option_1',
						text: {
							type: 'plain_text',
							text: 'lorem ipsum 🚀',
							emoji: true
						}
					},
					{
						value: 'option_2',
						text: {
							type: 'plain_text',
							text: 'lorem ipsum 🚀',
							emoji: true
						}
					}
				],
				placeholder: {
					type: 'plain_text',
					text: 'Select an item'
				},
				label: {
					type: 'plain_text',
					text: 'Label',
					emoji: true
				}
			}
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: 'Section + select with value undefined'
			},
			accessory: {
				type: 'multi_static_select',
				appId: 'app-id',
				blockId: 'block-id',
				actionId: 'action-id',
				initialValue: undefined,
				options: [
					{
						value: 'option_1',
						text: {
							type: 'plain_text',
							text: 'lorem ipsum 🚀',
							emoji: true
						}
					},
					{
						value: 'option_2',
						text: {
							type: 'plain_text',
							text: 'lorem ipsum 🚀',
							emoji: true
						}
					}
				],
				placeholder: {
					type: 'plain_text',
					text: 'Select an item'
				},
				label: {
					type: 'plain_text',
					text: 'Label',
					emoji: true
				}
			}
		}
	]);
SectionMultiSelect.storyName = 'Section + Multi Select';

export const Image = () =>
	UiKitMessage([
		{
			type: 'image',
			title: {
				type: 'plain_text',
				text: 'Example Image',
				emoji: true
			},
			imageUrl: 'https://raw.githubusercontent.com/RocketChat/Rocket.Chat.Artwork/master/Logos/icon-circle-256.png',
			altText: 'Example Image'
		}
	]);
Image.storyName = 'Image';

export const Context = () =>
	UiKitMessage([
		{
			type: 'context',
			elements: [
				{
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
		}
	]);
Context.storyName = 'Context';

export const ActionButton = () =>
	UiKitMessage([
		{
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
		}
	]);
ActionButton.storyName = 'Action - Buttons';

export const Fields = () =>
	UiKitMessage([
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
		}
	]);
Fields.storyName = 'Fields';

export const ActionSelect = () =>
	UiKitMessage([
		{
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
		}
	]);
ActionSelect.storyName = 'Action - Select';
