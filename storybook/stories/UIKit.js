import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { UiKitMessage } from '../../app/containers/UIKit';
import StoriesSeparator from './StoriesSeparator';

// eslint-disable-next-line react/prop-types
const Separator = ({ title }) => <StoriesSeparator title={title} theme='light' />;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#efeff4'
	}
});

export default () => (
	<ScrollView style={styles.container}>
		<Separator title='Section + image' />
		<UiKitMessage
			blocks={[{
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
			}]}
		/>

		<Separator title='Section + button' />
		<UiKitMessage
			blocks={[{
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
			}]}
		/>

		<Separator title='Section + Select' />
		<UiKitMessage
			blocks={[{
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
			}]}
		/>

		<Separator title='Section + Multi Select' />
		<UiKitMessage
			blocks={[{
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
			}]}
		/>

		<Separator title='Image' />
		<UiKitMessage
			blocks={[{
				type: 'image',
				title: {
					type: 'plain_text',
					text: 'Example Image',
					emoji: true
				},
				imageUrl: 'https://raw.githubusercontent.com/RocketChat/Rocket.Chat.Artwork/master/Logos/icon-circle-256.png',
				altText: 'Example Image'
			}]}
		/>

		<Separator title='Context' />
		<UiKitMessage
			blocks={[{
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
			}]}
		/>

		<Separator title='Action - Buttons' />
		<UiKitMessage
			blocks={[{
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
					}
				]
			}]}
		/>

		<Separator title='Fields' />
		<UiKitMessage
			blocks={[
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
				}]}
		/>

		<Separator title='Action - Select' />
		<UiKitMessage
			blocks={[{
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
			}]}
		/>
	</ScrollView>
);
