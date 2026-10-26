import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react-native';

import { MessageBlock, ModalBlockWithContext } from '../MessageBlock';
import { mockedStore } from '~/reducers/mockedStore';

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
