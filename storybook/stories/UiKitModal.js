import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';

import { UiKitModal, UiKitComponent } from '../../app/containers/UIKit';
import { KitContext, defaultContext } from '../../app/containers/UIKit/utils';
import StoriesSeparator from './StoriesSeparator';

// eslint-disable-next-line react/prop-types
const Separator = ({ title }) => <StoriesSeparator title={title} theme='light' />;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff'
	},
	padding: {
		paddingHorizontal: 16
	}
});

export default () => (
	<SafeAreaView style={styles.container}>
		<ScrollView style={[styles.container, styles.padding]} keyboardShouldPersistTaps='always'>
			<Separator title='Modal - Section and Selects' />
			{
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
				])
			}

			<Separator title='Modal - Section Accessories' />
			{
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
				])
			}

			<Separator title='Modal - Form Input' />
			{
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
					},
					{
						type: 'input',
						element: {
							type: 'multi_static_select',
							options: [{
								text: {
									type: 'plain_text',
									text: 'John'
								},
								value: 1
							}, {
								text: {
									type: 'plain_text',
									text: 'Dog'
								},
								value: 2
							}]
						},
						label: {
							type: 'plain_text',
							text: 'Share with...',
							emoji: true
						}
					}
				])
			}

			<Separator title='Modal - Form TextArea' />
			{
				UiKitModal([
					{
						type: 'context',
						elements: [{
							type: 'mrkdwn',
							text: 'Task: ZOL-994'
						}]
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
				])
			}

			<Separator title='Modal - Images' />
			{
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
				])
			}

			<Separator title='Modal - Actions' />
			{
				UiKitModal([{
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
							}, {
								value: 2,
								text: {
									type: 'plain_text',
									text: 'second button'
								}
							}]
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
							}, {
								value: 2,
								text: {
									type: 'plain_text',
									text: 'second button'
								}
							}]
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
							}, {
								value: 2,
								text: {
									type: 'plain_text',
									text: 'second button'
								}
							}]
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
							}, {
								value: 2,
								text: {
									type: 'plain_text',
									text: 'second button'
								}
							}]
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
				}])
			}

			<Separator title='Modal - Contexts and Dividers' />
			{
				UiKitModal([
					{
						type: 'context',
						elements: [{
							type: 'mrkdwn',
							text: 'Due today'
						}]
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
				])
			}

			<Separator title='Modal - Input with error' />
			<KitContext.Provider value={{ ...defaultContext, errors: { 'input-test': 'error test' } }}>
				<UiKitComponent
					render={UiKitModal}
					blocks={[{
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
					}]}
				/>
			</KitContext.Provider>

			<Separator title='Modal - Multilne with error' />
			<KitContext.Provider value={{ ...defaultContext, errors: { 'input-test': 'error test' } }}>
				<UiKitComponent
					render={UiKitModal}
					blocks={[{
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
					}]}
				/>
			</KitContext.Provider>

			<Separator title='Modal - DatePicker with error' />
			<KitContext.Provider value={{ ...defaultContext, errors: { 'input-test': 'error test' } }}>
				<UiKitComponent
					render={UiKitModal}
					blocks={[{
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
					}]}
				/>
			</KitContext.Provider>
		</ScrollView>
	</SafeAreaView>
);
