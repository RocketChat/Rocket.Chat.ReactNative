import { renderHook } from '@testing-library/react-native';

import { type RoomMembership } from '../../definitions';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { useRoomStore } from '../../stores/RoomStoreContext';
import { useFooterMessage } from './useFooterMessage';
import { useRoomFooterState } from './useRoomFooterState';

jest.mock('../../../../lib/hooks/useAppSelector', () => ({ useAppSelector: jest.fn() }));
jest.mock('../../stores/RoomStoreContext', () => ({ useRoomStore: jest.fn() }));
jest.mock('./useFooterMessage', () => ({ useFooterMessage: jest.fn() }));

const mockUseAppSelector = useAppSelector as jest.Mock;
const mockUseRoomStore = useRoomStore as jest.Mock;
const mockUseFooterMessage = useFooterMessage as jest.Mock;

const setup = (opts: {
	room?: Record<string, unknown>;
	membership?: RoomMembership;
	airGappedRemainingDays?: number | undefined;
	footerMessage?: string;
}) => {
	const state = { room: opts.room ?? {}, membership: opts.membership ?? 'subscribed' };
	mockUseRoomStore.mockImplementation((selector: (s: typeof state) => unknown) => selector(state));
	mockUseAppSelector.mockReturnValue(opts.airGappedRemainingDays);
	mockUseFooterMessage.mockReturnValue(opts.footerMessage ?? '');
	return renderHook(() => useRoomFooterState());
};

describe('useRoomFooterState', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns onHold when the room is on hold', () => {
		const { result } = setup({ room: { onHold: true }, membership: 'preview', airGappedRemainingDays: 0, footerMessage: 'msg' });

		expect(result.current).toEqual({ kind: 'onHold' });
	});

	it('returns takeOrJoin for a Preview Mode room', () => {
		const { result } = setup({ membership: 'preview', airGappedRemainingDays: 0, footerMessage: 'msg' });

		expect(result.current).toEqual({ kind: 'takeOrJoin' });
	});

	it('returns takeOrJoin for an Invited room', () => {
		const { result } = setup({ membership: 'invited', airGappedRemainingDays: 0, footerMessage: 'msg' });

		expect(result.current).toEqual({ kind: 'takeOrJoin' });
	});

	it('returns airgapped when restriction remaining days is 0', () => {
		const { result } = setup({ membership: 'subscribed', airGappedRemainingDays: 0, footerMessage: 'msg' });

		expect(result.current).toEqual({ kind: 'airgapped' });
	});

	it('returns preview with the footer message when one is present', () => {
		const { result } = setup({ membership: 'subscribed', airGappedRemainingDays: undefined, footerMessage: 'preview-me' });

		expect(result.current).toEqual({ kind: 'preview', message: 'preview-me' });
	});

	it('returns composer for a Subscribed Room by default', () => {
		const { result } = setup({ membership: 'subscribed', airGappedRemainingDays: undefined, footerMessage: '' });

		expect(result.current).toEqual({ kind: 'composer' });
	});
});
