import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import Blocks from '../message/Blocks';

describe('UIKit info_card', () => {
	it('renders rows and dispatches icon button actions through message blocks', async () => {
		const blockAction = jest.fn();
		const blocks = [
			{
				type: 'info_card',
				appId: 'media-call-core',
				blockId: 'missed-call-card',
				rows: [
					{
						background: 'default',
						elements: [
							{
								type: 'icon',
								icon: 'phone-question-mark',
								variant: 'warning',
								framed: true
							},
							{
								type: 'plain_text',
								text: 'Call not answered'
							}
						],
						action: {
							type: 'icon_button',
							actionId: 'open-history',
							appId: 'media-call-core',
							blockId: 'missed-call-card',
							label: 'Call history',
							value: 'history',
							icon: {
								type: 'icon',
								icon: 'info',
								variant: 'default'
							}
						}
					},
					{
						background: 'secondary',
						elements: [
							{
								type: 'plain_text',
								text: '00:31'
							}
						]
					}
				]
			}
		];

		const { getByText, getByLabelText } = render(
			<Blocks blocks={blocks} id='message-id' rid='room-id' blockAction={blockAction} />
		);

		expect(getByText('Call not answered')).toBeTruthy();
		expect(getByText('00:31')).toBeTruthy();

		fireEvent.press(getByLabelText('Call history'));

		await waitFor(() => {
			expect(blockAction).toHaveBeenCalledWith({
				actionId: 'open-history',
				appId: 'media-call-core',
				value: 'history',
				blockId: 'missed-call-card',
				rid: 'room-id',
				mid: 'message-id'
			});
		});
	});
});
