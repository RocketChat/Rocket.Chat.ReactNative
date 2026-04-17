import { resetVoipState } from './resetVoipState';
import { useCallStore } from './useCallStore';

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: jest.fn()
	}
}));

describe('resetVoipState', () => {
	it('calls resetNativeCallId before reset (native id must clear before store reset)', () => {
		const order: string[] = [];
		const resetNativeCallId = jest.fn(() => {
			order.push('resetNativeCallId');
		});
		const reset = jest.fn(() => {
			order.push('reset');
		});
		(useCallStore.getState as jest.Mock).mockReturnValue({ resetNativeCallId, reset });

		resetVoipState();

		expect(order).toEqual(['resetNativeCallId', 'reset']);
	});
});
