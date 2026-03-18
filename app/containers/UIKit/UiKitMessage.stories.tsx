import { View } from 'react-native';

import MessageContext from '../message/Context';
import { UiKitMessage } from '.';
import { themes, colors } from '../../lib/constants/colors';
import { longText } from '../../../.rnstorybook/utils';
import {
	BASE_ROW_HEIGHT,
	BASE_ROW_HEIGHT_CONDENSED,
	ResponsiveLayoutContext
} from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { ThemeContext } from '../../theme';

const user = {
	id: 'y8bd77ptZswPj3EW8',
	username: 'diego.mello',
	token: 'abc'
};

const baseUrl = 'https://open.rocket.chat';
const theme = 'dark';

export default {
	title: 'UIKit/UiKitMessage',
	decorators: [
		(Story: any) => (
			<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
				<ResponsiveLayoutContext.Provider
					value={{
						fontScale: 1,
						fontScaleLimited: 1,
						isLargeFontScale: false,
						rowHeight: BASE_ROW_HEIGHT,
						rowHeightCondensed: BASE_ROW_HEIGHT_CONDENSED,
						width: 350,
						height: 800
					}}>
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
						}}>
						<Story />
					</MessageContext.Provider>
				</ResponsiveLayoutContext.Provider>
			</ThemeContext.Provider>
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

// FIXME: Commented out because it's breaking jest snapshots
// export const SectionImage = () =>
// 	UiKitMessage([
// 		{
// 			type: 'section',
// 			text: {
// 				type: 'mrkdwn',
// 				text: 'Section + Image'
// 			},
// 			accessory: {
// 				type: 'image',
// 				imageUrl: 'https://raw.githubusercontent.com/RocketChat/Rocket.Chat.Artwork/master/Logos/icon-circle-256.png',
// 				altText: 'plants'
// 			}
// 		}
// 	]);
// SectionImage.storyName = 'Section + image';

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

// FIXME: Commented out because it's breaking jest snapshots
// export const Image = () =>
// 	UiKitMessage([
// 		{
// 			type: 'image',
// 			title: {
// 				type: 'plain_text',
// 				text: 'Example Image',
// 				emoji: true
// 			},
// 			imageUrl: 'https://raw.githubusercontent.com/RocketChat/Rocket.Chat.Artwork/master/Logos/icon-circle-256.png',
// 			altText: 'Example Image'
// 		}
// 	]);
// Image.storyName = 'Image';

// FIXME: Commented out because it's breaking jest snapshots
// export const Context = () =>
// 	UiKitMessage([
// 		{
// 			type: 'context',
// 			elements: [
// 				{
// 					type: 'image',
// 					title: {
// 						type: 'plain_text',
// 						text: 'Example Image',
// 						emoji: true
// 					},
// 					imageUrl: 'https://raw.githubusercontent.com/RocketChat/Rocket.Chat.Artwork/master/Logos/icon-circle-256.png',
// 					altText: 'Example Image'
// 				},
// 				{
// 					type: 'mrkdwn',
// 					text: 'context'
// 				}
// 			]
// 		}
// 	]);
// Context.storyName = 'Context';

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

const getInfoCardAction = ({
	appId,
	blockId,
	icon,
	label
}: {
	appId?: string;
	blockId?: string;
	icon: string;
	label?: string;
}) => ({
	type: 'icon_button',
	actionId: 'open-history',
	...(appId ? { appId } : {}),
	...(blockId ? { blockId } : {}),
	label: label ?? 'Call history',
	icon: {
		type: 'icon',
		icon,
		variant: 'default'
	}
});

export const InfoCard = () => (
	<View style={{ padding: 10, gap: 10 }}>
		{UiKitMessage([
			{
				type: 'info_card',
				appId: 'media-call-core',
				blockId: 'ended-call',
				rows: [
					{
						background: 'default',
						elements: [
							{ type: 'icon', icon: 'phone-off', framed: true, variant: 'secondary' },
							{ type: 'mrkdwn', text: 'Call ended', i18n: { key: 'Call_ended_bold' } }
						],
						action: getInfoCardAction({ appId: 'media-call-core', blockId: 'ended-call', icon: 'info' })
					},
					{
						background: 'secondary',
						elements: [{ type: 'mrkdwn', text: '*00:06*' }]
					}
				]
			}
		])}
		{UiKitMessage([
			{
				type: 'info_card',
				appId: 'media-call-core',
				blockId: 'transferred-call',
				rows: [
					{
						background: 'default',
						elements: [
							{ type: 'icon', icon: 'arrow-forward', framed: true, variant: 'secondary' },
							{ type: 'mrkdwn', text: 'Call transferred', i18n: { key: 'Call_transferred_bold' } }
						]
					},
					{
						background: 'secondary',
						elements: [{ type: 'mrkdwn', text: '*00:06*' }]
					}
				]
			}
		])}
		{UiKitMessage([
			{
				type: 'info_card',
				appId: 'media-call-core',
				blockId: 'not-answered-call',
				rows: [
					{
						background: 'default',
						elements: [
							{ type: 'icon', icon: 'phone-question-mark', framed: true, variant: 'warning' },
							{ type: 'mrkdwn', text: 'Call not answered', i18n: { key: 'Call_not_answered_bold' } }
						],
						action: getInfoCardAction({ appId: 'media-call-core', blockId: 'not-answered-call', icon: 'info' })
					}
				]
			}
		])}
		{UiKitMessage([
			{
				type: 'info_card',
				appId: 'media-call-core',
				blockId: 'failed-call',
				rows: [
					{
						background: 'default',
						elements: [
							{ type: 'icon', icon: 'phone-issue', framed: true, variant: 'danger' },
							{ type: 'mrkdwn', text: 'Call failed', i18n: { key: 'Call_failed_bold' } }
						]
					}
				]
			}
		])}
	</View>
);
InfoCard.storyName = 'Info Card';

export const InfoCardIcons = () =>
	UiKitMessage([
		{
			type: 'info_card',
			blockId: 'multiple-icons',
			rows: [
				{
					background: 'default',
					elements: [
						{ type: 'plain_text', text: 'Framed icons' },
						{ type: 'icon', icon: 'phone-off', variant: 'default', framed: true },
						{ type: 'icon', icon: 'clock', variant: 'warning', framed: true },
						{ type: 'icon', icon: 'phone-question-mark', variant: 'warning', framed: true },
						{ type: 'icon', icon: 'phone-issue', variant: 'danger', framed: true }
					]
				},
				{
					background: 'secondary',
					elements: [
						{ type: 'plain_text', text: 'Icons' },
						{ type: 'icon', icon: 'phone-off', variant: 'default' },
						{ type: 'icon', icon: 'clock', variant: 'warning' },
						{ type: 'icon', icon: 'phone-question-mark', variant: 'warning' },
						{ type: 'icon', icon: 'phone-issue', variant: 'danger' },
						{ type: 'icon', icon: 'info', variant: 'secondary' }
					]
				}
			]
		}
	]);
InfoCardIcons.storyName = 'Info Card - Icons';

export const InfoCardI18n = () =>
	UiKitMessage([
		{
			type: 'info_card',
			blockId: 'i18n-keys',
			rows: [
				{
					background: 'default',
					elements: [{ type: 'mrkdwn', text: 'Call ended', i18n: { key: 'Call_ended_bold' } }]
				},
				{
					background: 'default',
					elements: [{ type: 'mrkdwn', text: 'Call failed', i18n: { key: 'Call_failed_bold' } }]
				},
				{
					background: 'default',
					elements: [{ type: 'mrkdwn', text: 'Call not answered', i18n: { key: 'Call_not_answered_bold' } }]
				},
				{
					background: 'default',
					elements: [{ type: 'mrkdwn', text: 'Call transferred', i18n: { key: 'Call_transferred_bold' } }]
				}
			]
		}
	]);
InfoCardI18n.storyName = 'Info Card - i18n';

export const InfoCardLongText = () =>
	UiKitMessage([
		{
			type: 'info_card',
			appId: 'media-call-core',
			blockId: 'edge-action-no-ids',
			rows: [
				{
					background: 'default',
					elements: [
						{ type: 'icon', icon: 'phone-question-mark', variant: 'warning' },
						{
							type: 'plain_text',
							text: longText
						}
					],
					action: getInfoCardAction({ icon: 'info', label: 'Details' })
				},
				{
					background: 'secondary',
					elements: [{ type: 'plain_text', text: longText }]
				}
			]
		}
	]);
InfoCardLongText.storyName = 'Info Card - Long text';
