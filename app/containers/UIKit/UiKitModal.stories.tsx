/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { UiKitComponent, UiKitModal } from '.';
import { KitContext, defaultContext } from './utils';
import MessageContext from '../message/Context';
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
	title: 'UIKit/UiKitModal',
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

export const ModalSectionSelects = () =>
	UiKitModal([
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: '*Rocket.Chat is free, unlimited and open source* 🚀\nIf you have any doubt ask to @rocketcat'
			}
		},
		{
			type: 'divider'
		},
		{
			type: 'section',
			fields: [
				{
					type: 'mrkdwn',
					text: '*Text 1*\nDescription, Mussum Ipsum, cacilds vidis litro'
				},
				{
					type: 'mrkdwn',
					text: '*Text 2*\nDescription, Mussum Ipsum, cacilds vidis litro'
				}
			]
		},
		{
			type: 'section',
			fields: [
				{
					type: 'mrkdwn',
					text: '*Text 3*\nDescription, Mussum Ipsum, cacilds vidis litro'
				},
				{
					type: 'mrkdwn',
					text: '*Text 4*\nDescription, Mussum Ipsum, cacilds vidis litro'
				}
			]
		}
	]);
ModalSectionSelects.storyName = 'Modal - Section and Selects';

export const ModalSectionAccessories = () =>
	UiKitModal([
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: '*Bruno Quadros*,\nPlease review your details for your *travel expense*.\nExpense no. *DA921*.'
			},
			accessory: {
				type: 'image',
				imageUrl: 'https://raw.githubusercontent.com/RocketChat/Rocket.Chat.Artwork/master/Logos/icon-circle-256.png'
			}
		},
		{
			type: 'divider'
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: '*Date:*\n11/02/2020'
			}
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: '*Category:*\nTravel'
			}
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: '*Cost:*\n$150.00 USD'
			}
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: '*Notes:*\nWebSummit Conference'
			}
		}
	]);
ModalSectionAccessories.storyName = 'Modal - Section and Accessories';

export const ModalFormInput = () =>
	UiKitModal([
		{
			type: 'input',
			element: {
				type: 'plain_text_input'
			},
			label: {
				type: 'plain_text',
				text: 'Outgoing Title',
				emoji: true
			},
			hint: {
				type: 'plain_text',
				text: 'Pick something unique!',
				emoji: true
			}
		},
		{
			type: 'input',
			element: {
				type: 'datepicker',
				initial_date: '1990-04-28',
				placeholder: {
					type: 'plain_text',
					text: 'Select a date',
					emoji: true
				}
			},
			label: {
				type: 'plain_text',
				text: 'Set a date',
				emoji: true
			}
		}
	]);
ModalFormInput.storyName = 'Modal - Form Input';

export const ModalMultiSelect = () =>
	UiKitModal([
		{
			type: 'input',
			element: {
				type: 'multi_static_select',
				options: [
					{
						text: {
							type: 'plain_text',
							text: 'John'
						},
						value: 1
					},
					{
						text: {
							type: 'plain_text',
							text: 'Dog'
						},
						value: 2
					}
				]
			},
			label: {
				type: 'plain_text',
				text: 'Share with...',
				emoji: true
			},
			hint: {
				type: 'plain_text',
				text: 'Initial Value Undefined',
				emoji: true
			}
		},
		{
			type: 'input',
			element: {
				type: 'multi_static_select',
				initialValue: [1],
				options: [
					{
						text: {
							type: 'plain_text',
							text: 'John'
						},
						value: 1
					},
					{
						text: {
							type: 'plain_text',
							text: 'Dog'
						},
						value: 2
					}
				]
			},
			label: {
				type: 'plain_text',
				text: 'Share with...',
				emoji: true
			},
			hint: {
				type: 'plain_text',
				text: 'Initial Value as John',
				emoji: true
			}
		}
	]);
ModalMultiSelect.storyName = 'Modal - Multi Select Input';

export const ModalFormTextArea = () =>
	UiKitModal([
		{
			type: 'context',
			elements: [
				{
					type: 'mrkdwn',
					text: 'Task: ZOL-994'
				}
			]
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: 'Update Spec final assets'
			},
			accessory: {
				type: 'button',
				text: {
					type: 'plain_text',
					text: 'Change'
				}
			}
		},
		{
			type: 'divider'
		},
		{
			type: 'input',
			element: {
				type: 'plain_text_input',
				multiline: true
			},
			placeholder: {
				type: 'plain_text',
				text: 'Write Something',
				emoji: true
			},
			label: {
				type: 'plain_text',
				text: 'Notes',
				emoji: true
			},
			hint: {
				type: 'plain_text',
				text: 'Please take the time to compose something short',
				emoji: true
			},
			description: {
				type: 'plain_text',
				text: 'Describe your update',
				emoji: true
			}
		}
	]);
ModalFormTextArea.storyName = 'Modal - Form TextArea';

export const ModalImages = () =>
	UiKitModal([
		{
			type: 'image',
			title: {
				type: 'plain_text',
				text: 'Example Image',
				emoji: true
			},
			imageUrl: 'https://raw.githubusercontent.com/RocketChat/Rocket.Chat.Artwork/master/Logos/icon-circle-256.png',
			alt_text: 'Example Image'
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: 'How could be the life in Mars?'
			}
		},
		{
			type: 'context',
			elements: [
				{
					type: 'image',
					imageUrl: 'https://raw.githubusercontent.com/RocketChat/Rocket.Chat.Artwork/master/Logos/icon-circle-256.png'
				},
				{
					type: 'mrkdwn',
					text: 'November 25, 2019'
				}
			]
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: '*Next stop, Mars!*\nMussum Ipsum, cacilds vidis litro abertis. Admodum accumsan disputationi eu sit. Vide electram sadipscing et per. Diuretics paradis num copo é motivis de denguis. Mais vale um bebadis conhecidiss, que um alcoolatra anonimis. Aenean aliquam molestie leo, vitae iaculis nisl.'
			}
		}
	]);
ModalImages.storyName = 'Modal - Images';

export const ModalActions = () =>
	UiKitModal([
		{
			type: 'input',
			element: {
				type: 'plain_text_input'
			},
			label: {
				type: 'plain_text',
				text: 'Title',
				emoji: true
			}
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: 'Details'
			}
		},
		{
			type: 'section',
			accessory: {
				type: 'static_select',
				options: [
					{
						value: 1,
						text: {
							type: 'plain_text',
							text: 'TypeL Task'
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
		},
		{
			type: 'section',
			accessory: {
				type: 'static_select',
				options: [
					{
						value: 1,
						text: {
							type: 'plain_text',
							text: 'Project: Space (winter)'
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
		},
		{
			type: 'section',
			accessory: {
				type: 'static_select',
				options: [
					{
						value: 1,
						text: {
							type: 'plain_text',
							text: 'Priority (optional)'
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
		},
		{
			type: 'section',
			accessory: {
				type: 'static_select',
				options: [
					{
						value: 1,
						text: {
							type: 'plain_text',
							text: 'Assinee (optional)'
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
		},
		{
			type: 'input',
			element: {
				type: 'plain_text_input',
				multiline: true
			},
			placeholder: {
				type: 'plain_text',
				text: 'Write Something',
				emoji: true
			},
			label: {
				type: 'plain_text',
				text: 'Description',
				emoji: true
			}
		}
	]);
ModalActions.storyName = 'Modal - Actions';

export const ModalContextsDividers = () =>
	UiKitModal([
		{
			type: 'context',
			elements: [
				{
					type: 'mrkdwn',
					text: 'Due today'
				}
			]
		},
		{
			type: 'divider'
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: 'Finish interface componests (3 hours)'
			},
			accessory: {
				blockId: 'overflow-1',
				type: 'overflow',
				options: [
					{
						text: {
							type: 'plain_text',
							text: 'Details',
							emoji: true
						},
						value: 'value-0'
					},
					{
						text: {
							type: 'plain_text',
							text: 'Remove',
							emoji: true
						},
						value: 'value-1'
					}
				]
			}
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: 'English Class (1 hour)'
			},
			accessory: {
				blockId: 'overflow-2',
				type: 'overflow',
				options: [
					{
						text: {
							type: 'plain_text',
							text: 'Details',
							emoji: true
						},
						value: 'value-0'
					},
					{
						text: {
							type: 'plain_text',
							text: 'Remove',
							emoji: true
						},
						value: 'value-1'
					}
				]
			}
		},
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: 'Send an email to John (15min)'
			},
			accessory: {
				blockId: 'overflow-3',
				type: 'overflow',
				options: [
					{
						text: {
							type: 'plain_text',
							text: 'Details',
							emoji: true
						},
						value: 'value-0'
					},
					{
						text: {
							type: 'plain_text',
							text: 'Remove',
							emoji: true
						},
						value: 'value-1'
					}
				]
			}
		}
	]);
ModalContextsDividers.storyName = 'Modal - Contexts and Dividers';

export const ModalInputWithError = () => (
	<KitContext.Provider value={{ ...defaultContext, errors: { 'input-test': 'error test' } }}>
		<UiKitComponent
			render={UiKitModal}
			blocks={[
				{
					type: 'input',
					element: {
						type: 'plain_text_input',
						actionId: 'input-test'
					},
					label: {
						type: 'plain_text',
						text: 'Label',
						emoji: true
					}
				}
			]}
		/>
	</KitContext.Provider>
);
ModalInputWithError.storyName = 'Modal - Input with error';

export const ModalMultilneWithError = () => (
	<KitContext.Provider value={{ ...defaultContext, errors: { 'input-test': 'error test' } }}>
		<UiKitComponent
			render={UiKitModal}
			blocks={[
				{
					type: 'input',
					element: {
						type: 'plain_text_input',
						multiline: true,
						actionId: 'input-test'
					},
					label: {
						type: 'plain_text',
						text: 'Label',
						emoji: true
					}
				}
			]}
		/>
	</KitContext.Provider>
);
ModalMultilneWithError.storyName = 'Modal - Multilne with error';

export const ModalDatePickerWithError = () => (
	<KitContext.Provider value={{ ...defaultContext, errors: { 'input-test': 'error test' } }}>
		<UiKitComponent
			render={UiKitModal}
			blocks={[
				{
					type: 'input',
					element: {
						type: 'datepicker',
						initial_date: '1990-04-28',
						actionId: 'input-test',
						placeholder: {
							type: 'plain_text',
							text: 'Select a date',
							emoji: true
						}
					},
					label: {
						type: 'plain_text',
						text: 'Label',
						emoji: true
					}
				}
			]}
		/>
	</KitContext.Provider>
);
ModalDatePickerWithError.storyName = 'Modal - DatePicker with error';
