import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react-native';

import Blocks from '../Blocks';
import { MessageProvider } from '~/containers/message/stores/MessageStore';
import { MessageRoomProvider, type MessageRoomState } from '~/containers/message/stores/MessageRoomStore';
import { mockedStore } from '~/reducers/mockedStore';
import { type TAnyMessageModel } from '~/definitions';

jest.mock('~/containers/UIKit/MessageBlock', () => ({
	MessageBlock: jest.fn(() => null)
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MessageBlock } = jest.requireMock('~/containers/UIKit/MessageBlock');

const buildItem = (blocks: TAnyMessageModel['blocks']) => ({ id: 'msg-1', blocks }) as unknown as TAnyMessageModel;

const buildTree = (blocks: TAnyMessageModel['blocks'], config: Partial<MessageRoomState> = {}) => (
	<Provider store={mockedStore}>
		<MessageRoomProvider timeFormat='fixed-format' {...config}>
			<MessageProvider item={buildItem(blocks)}>
				<Blocks />
			</MessageProvider>
		</MessageRoomProvider>
	</Provider>
);

const renderBlocks = (blocks: TAnyMessageModel['blocks'], config: Partial<MessageRoomState> = {}) =>
	render(buildTree(blocks, config));

const lastContext = () => MessageBlock.mock.lastCall[0].context;

describe('Blocks', () => {
	beforeEach(() => {
		MessageBlock.mockReset();
	});

	it('renders null and skips MessageBlock when blocks is null', () => {
		const { toJSON } = renderBlocks(null);
		expect(toJSON()).toBeNull();
		expect(MessageBlock).not.toHaveBeenCalled();
	});

	it('renders null and skips MessageBlock when blocks is empty', () => {
		const { toJSON } = renderBlocks([]);
		expect(toJSON()).toBeNull();
		expect(MessageBlock).not.toHaveBeenCalled();
	});

	it('passes the blocks and wires appId from the first block and rid', () => {
		const blocks = [{ appId: 'app-1' }] as TAnyMessageModel['blocks'];
		renderBlocks(blocks, { rid: 'room-1' });
		expect(MessageBlock.mock.lastCall[0].blocks).toEqual(blocks);
		expect(lastContext()).toEqual(expect.objectContaining({ appId: 'app-1', rid: 'room-1' }));
	});

	it('falls back appId to an empty string when the first block has none', () => {
		renderBlocks([{}] as TAnyMessageModel['blocks']);
		expect(lastContext()).toEqual(expect.objectContaining({ appId: '' }));
	});

	it("calls blockAction with the wired params and rid defaulted to '' when absent", async () => {
		const blockAction = jest.fn();
		renderBlocks([{ appId: 'app-1' }] as TAnyMessageModel['blocks'], { handlers: { blockAction } as any });

		await lastContext().action({ actionId: 'submit', value: 'v', blockId: 'block-1' });

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

		await expect(lastContext().action({ actionId: 'submit', value: 'v', blockId: 'block-1' })).resolves.toBeUndefined();
	});

	it('keeps the block subtree mounted when the block action handler changes', () => {
		const onMount = jest.fn();
		MessageBlock.mockImplementation(() => {
			useEffect(() => onMount(), []);
			return null;
		});
		const blocks = [{ appId: 'app-1' }] as TAnyMessageModel['blocks'];

		const { rerender } = renderBlocks(blocks, { handlers: { blockAction: jest.fn() } as any });
		rerender(buildTree(blocks, { handlers: { blockAction: jest.fn() } as any }));

		expect(MessageBlock.mock.calls.length).toBeGreaterThan(1);
		expect(onMount).toHaveBeenCalledTimes(1);
	});
});
