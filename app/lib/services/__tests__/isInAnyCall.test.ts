import { isInAnyCall } from '../isInAnyCall';
import { usePexipCallStore } from '../videoConf/usePexipCallStore';
import { isInActiveVoipCall } from '../voip/isInActiveVoipCall';

jest.mock('../voip/isInActiveVoipCall', () => ({ isInActiveVoipCall: jest.fn(() => false), useIsInActiveVoipCall: jest.fn() }));

describe('isInAnyCall', () => {
	beforeEach(() => {
		usePexipCallStore.getState().leave();
		jest.mocked(isInActiveVoipCall).mockReturnValue(false);
	});

	it('is false without a call', () => {
		expect(isInAnyCall()).toBe(false);
	});

	it('is true during a VoIP call', () => {
		jest.mocked(isInActiveVoipCall).mockReturnValue(true);
		expect(isInAnyCall()).toBe(true);
	});

	it('is true during a Pexip call', () => {
		usePexipCallStore
			.getState()
			.open({ callId: 'call-1', url: 'https://pexip.example/call', server: 'https://open.rocket.chat' });
		expect(isInAnyCall()).toBe(true);
	});
});
