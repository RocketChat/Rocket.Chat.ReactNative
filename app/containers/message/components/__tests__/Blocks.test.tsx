import { Provider } from 'react-redux';
import { render } from '@testing-library/react-native';

import Blocks from '../Blocks';
import { MessageProvider } from '../../stores/MessageStore';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
import { mockedStore } from '../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../definitions';

jest.mock('../../../UIKit/MessageBlock', () => ({
	messageBlockWithContext: jest.fn(() => () => null)
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { messageBlockWithContext } = jest.requireMock('../../../UIKit/MessageBlock');

const buildItem = (blocks: TAnyMessageModel['blocks']) => ({ id: 'msg-1', blocks }) as unknown as TAnyMessageModel;

const renderBlocks = (blocks: TAnyMessageModel['blocks'], config: Partial<MessageRoomState> = {}) =>
	render(
		<Provider store={mockedStore}>
			<MessageRoomProvider timeFormat='fixed-format' {...config}>
				<MessageProvider item={buildItem(blocks)}>
					<Blocks />
				</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);

describe('Blocks', () => {
	beforeEach(() => {
		messageBlockWithContext.mockClear();
	});

	it('renders null and skips messageBlockWithContext when blocks is null', () => {
		const { toJSON } = renderBlocks(null);
		expect(toJSON()).toBeNull();
		expect(messageBlockWithContext).not.toHaveBeenCalled();
	});

	it('renders null and skips messageBlockWithContext when blocks is empty', () => {
		const { toJSON } = renderBlocks([]);
		expect(toJSON()).toBeNull();
		expect(messageBlockWithContext).not.toHaveBeenCalled();
	});

	it('wires appId from the first block and forwards rid', () => {
		renderBlocks([{ appId: 'app-1' }] as TAnyMessageModel['blocks'], { rid: 'room-1' });
		expect(messageBlockWithContext).toHaveBeenCalledWith(expect.objectContaining({ appId: 'app-1', rid: 'room-1' }));
	});

	it('falls back appId to an empty string when the first block has none', () => {
		renderBlocks([{}] as TAnyMessageModel['blocks']);
		expect(messageBlockWithContext).toHaveBeenCalledWith(expect.objectContaining({ appId: '' }));
	});

	it("calls blockAction with the wired params and rid defaulted to '' when absent", async () => {
		const blockAction = jest.fn();
		renderBlocks([{ appId: 'app-1' }] as TAnyMessageModel['blocks'], { handlers: { blockAction } });

		const { action } = messageBlockWithContext.mock.calls[0][0];
		await action({ actionId: 'submit', value: 'v', blockId: 'block-1' });

		expect(blockAction).toHaveBeenCalledWith({
			actionId: 'submit',
			appId: 'app-1',
			value: 'v',
			blockId: 'block-1',
			rid: '',
			mid: 'msg-1'
		});
	});

	it('no-ops without throwing when blockAction is undefined', async () => {
		renderBlocks([{ appId: 'app-1' }] as TAnyMessageModel['blocks']);

		const { action } = messageBlockWithContext.mock.calls[0][0];
		await expect(action({ actionId: 'submit', value: 'v', blockId: 'block-1' })).resolves.toBeUndefined();
	});
});
