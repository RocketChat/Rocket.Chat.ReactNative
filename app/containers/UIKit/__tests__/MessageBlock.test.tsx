import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { MessageBlock, ModalBlockWithContext } from '../MessageBlock';
import { mockedStore } from '~/reducers/mockedStore';
import openLink from '~/lib/methods/helpers/openLink';

jest.mock('~/lib/methods/helpers/openLink', () => ({ __esModule: true, default: jest.fn() }));

const missedCallCard = {
	appId: 'media-call-core',
	blockId: 'missed-call',
	type: 'info_card',
	rows: [
		{
			background: 'default',
			elements: [
				{ type: 'icon', icon: 'phone-off', variant: 'danger', framed: true },
				{ type: 'mrkdwn', text: '*Voice call not answered*' }
			]
		}
	]
};

const prStatusBlocks = [
	{
		type: 'markdown',
		appId: 'pr-status',
		blockId: 'pr-status:text',
		text: '[https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7940](github.com/RocketChat/Rocket.Chat.ReactNative/pull/7940)'
	},
	{
		type: 'preview',
		appId: 'pr-status',
		blockId: 'pr-status:preview',
		title: [{ type: 'plain_text', text: '#7940 chore: bump react-native-reanimated to 4.8.0' }],
		description: [{ type: 'mrkdwn', text: '🟡 CI running · 19/26 done\n➖ No reviews' }],
		externalUrl: 'https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7940',
		preview: {
			url: 'https://opengraph.githubassets.com/96def5ea/RocketChat/Rocket.Chat.ReactNative/pull/7940',
			dimensions: { width: 1200, height: 600 }
		},
		footer: {
			type: 'context',
			appId: 'pr-status',
			blockId: 'pr-status:footer',
			elements: [{ type: 'mrkdwn', text: '[diegolmello](https://github.com/diegolmello) · 🟢 Open · ✅ Ready to merge' }]
		}
	},
	{
		type: 'actions',
		appId: 'pr-status',
		blockId: 'pr-status:actions',
		elements: [
			{
				type: 'button',
				appId: 'pr-status',
				blockId: 'pr-status:actions',
				actionId: 'pr-status:refresh',
				value: 'RocketChat/Rocket.Chat.ReactNative#7940',
				text: { type: 'plain_text', text: 'Refresh' }
			}
		]
	}
];

const sectionBlock = { type: 'section', blockId: 'section', text: { type: 'plain_text', text: 'Section text' } };

const expectNoKeyWarning = (consoleError: jest.SpyInstance) =>
	expect(consoleError.mock.calls.flat().join(' ')).not.toContain('unique "key"');

describe('MessageBlock', () => {
	let consoleError: jest.SpyInstance;

	beforeEach(() => {
		consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleError.mockRestore();
	});

	it('renders several blocks without key warnings', () => {
		render(
			<Provider store={mockedStore}>
				<MessageBlock
					blocks={[missedCallCard, { type: 'divider', blockId: 'divider' }, { ...missedCallCard, blockId: 'second' }]}
					context={{ appId: 'media-call-core', rid: 'room-1', action: jest.fn() }}
				/>
			</Provider>
		);

		expect(screen.getAllByText('Voice call not answered')).toHaveLength(2);
		expectNoKeyWarning(consoleError);
	});

	it('renders the markdown, preview and actions blocks of an app message', () => {
		render(
			<Provider store={mockedStore}>
				<MessageBlock blocks={prStatusBlocks} context={{ appId: 'pr-status', rid: 'room-1', action: jest.fn() }} />
			</Provider>
		);

		expect(screen.getByText('https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7940')).toBeOnTheScreen();
		expect(screen.getByText('#7940 chore: bump react-native-reanimated to 4.8.0')).toBeOnTheScreen();
		expect(screen.getByText(/CI running · 19\/26 done/)).toBeOnTheScreen();
		expect(screen.getByText(/No reviews/)).toBeOnTheScreen();
		expect(screen.getByText(/Open · ✅ Ready to merge/)).toBeOnTheScreen();
		expect(screen.getByText('Refresh')).toBeOnTheScreen();
	});

	it('opens the preview external URL when the card is tapped', () => {
		render(
			<Provider store={mockedStore}>
				<MessageBlock blocks={prStatusBlocks} context={{ appId: 'pr-status', rid: 'room-1', action: jest.fn() }} />
			</Provider>
		);

		fireEvent.press(screen.getByText('#7940 chore: bump react-native-reanimated to 4.8.0'));

		expect(openLink).toHaveBeenCalledWith('https://github.com/RocketChat/Rocket.Chat.ReactNative/pull/7940', 'light');
	});

	it('renders modal blocks without key warnings', () => {
		render(
			<Provider store={mockedStore}>
				<ModalBlockWithContext blocks={[sectionBlock, { ...sectionBlock, blockId: 'second' }]} />
			</Provider>
		);

		expect(screen.getAllByText('Section text')).toHaveLength(2);
		expectNoKeyWarning(consoleError);
	});
});
