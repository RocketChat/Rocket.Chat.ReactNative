import { render } from '@testing-library/react-native';

import { useMessageAccessibilityHint } from './useMessageAccessibilityHint';
import MessageContext, { type IMessageContext } from '../Context';
import { MessageRoomProvider, pickMessageRoomState } from '../MessageRoomStore';
import { MessageProvider } from '../MessageStore';
import { type TAnyMessageModel } from '../../../definitions';

const buildItem = (overrides: Partial<TAnyMessageModel> = {}): TAnyMessageModel =>
	({ id: 'msg-1', ...overrides } as TAnyMessageModel);

const renderHint = (item: TAnyMessageModel, config: Partial<IMessageContext> = {}) => {
	const spy = jest.fn();
	const Probe = () => {
		spy(useMessageAccessibilityHint());
		return null;
	};
	render(
		<MessageRoomProvider {...pickMessageRoomState(config)}>
			<MessageContext.Provider value={config as IMessageContext}>
				<MessageProvider item={item}>
					<Probe />
				</MessageProvider>
			</MessageContext.Provider>
		</MessageRoomProvider>
	);
	const { calls } = spy.mock;
	return calls[calls.length - 1][0];
};

describe('useMessageAccessibilityHint', () => {
	it('returns the view thread hint when the message has a thread', () => {
		const result = renderHint(buildItem({ tlm: new Date(), tcount: 1 }), { isThreadRoom: false });
		expect(result).toBe('Press to view thread');
	});

	it('returns undefined when there is no thread', () => {
		const result = renderHint(buildItem({ tlm: undefined, tcount: null }), { isThreadRoom: false });
		expect(result).toBeUndefined();
	});

	it('returns undefined when rendered inside a thread room', () => {
		const result = renderHint(buildItem({ tlm: new Date(), tcount: 1 }), { isThreadRoom: true });
		expect(result).toBeUndefined();
	});
});
