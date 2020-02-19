import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView } from 'react-native';

import { UiKitMessage } from '../../app/containers/UIKit';
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
			<Separator title='Section' />
			{
				UiKitMessage([{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: 'Section'
					}
				}])
			}

			<Separator title='Section + Overflow' />
			{
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
				])
			}

			<Separator title='Section + image' />
			{
				UiKitMessage([{
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
				}])
			}

			<Separator title='Section + button' />
			{
				UiKitMessage([{
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
				}])
			}

			<Separator title='Section + Select' />
			{
				UiKitMessage([{
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
				}])
			}

			<Separator title='Section + DatePicker' />
			{
				UiKitMessage([{
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
				}])
			}

			<Separator title='Section + Multi Select' />
			{
				UiKitMessage([{
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
				}])
			}

			<Separator title='Image' />
			{
				UiKitMessage([{
					type: 'image',
					title: {
						type: 'plain_text',
						text: 'Example Image',
						emoji: true
					},
					imageUrl: 'https://raw.githubusercontent.com/RocketChat/Rocket.Chat.Artwork/master/Logos/icon-circle-256.png',
					altText: 'Example Image'
				}])
			}

			<Separator title='Context' />
			{
				UiKitMessage([{
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
				}])
			}

			<Separator title='Action - Buttons' />
			{
				UiKitMessage([{
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
				}])
			}

			<Separator title='Fields' />
			{
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
					}])
			}

			<Separator title='Action - Select' />
			{
				UiKitMessage([{
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
				}])
			}
		</ScrollView>
	</SafeAreaView>
);
