import { renderHook } from '@testing-library/react-native';

import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { useRoomStore, useRoomWithUpdate } from '../../stores/RoomStoreContext';
import { useFooterMessage } from './useFooterMessage';
import { useRoomFooterState } from './useRoomFooterState';

jest.mock('../../../../lib/hooks/useAppSelector', () => ({ useAppSelector: jest.fn() }));
jest.mock('../../stores/RoomStoreContext', () => ({ useRoomStore: jest.fn(), useRoomWithUpdate: jest.fn() }));
jest.mock('./useFooterMessage', () => ({ useFooterMessage: jest.fn() }));

const mockUseAppSelector = useAppSelector as jest.Mock;
const mockUseRoomStore = useRoomStore as jest.Mock;
const mockUseRoomWithUpdate = useRoomWithUpdate as jest.Mock;
const mockUseFooterMessage = useFooterMessage as jest.Mock;

const setup = (opts: {
	room?: Record<string, unknown>;
	joined?: boolean;
	airGappedRemainingDays?: number | undefined;
	footerMessage?: string;
}) => {
	mockUseRoomWithUpdate.mockReturnValue(opts.room ?? {});
	mockUseRoomStore.mockReturnValue(opts.joined ?? true);
	mockUseAppSelector.mockReturnValue(opts.airGappedRemainingDays);
	mockUseFooterMessage.mockReturnValue(opts.footerMessage ?? '');
	return renderHook(() => useRoomFooterState());
};

describe('useRoomFooterState', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns onHold when the room is on hold', () => {
		const { result } = setup({ room: { onHold: true }, joined: false, airGappedRemainingDays: 0, footerMessage: 'msg' });

		expect(result.current).toEqual({ kind: 'onHold' });
	});

	it('returns takeOrJoin when not joined', () => {
		const { result } = setup({ joined: false, airGappedRemainingDays: 0, footerMessage: 'msg' });

		expect(result.current).toEqual({ kind: 'takeOrJoin' });
	});

	it('returns airgapped when restriction remaining days is 0', () => {
		const { result } = setup({ joined: true, airGappedRemainingDays: 0, footerMessage: 'msg' });

		expect(result.current).toEqual({ kind: 'airgapped' });
	});

	it('returns preview with the footer message when one is present', () => {
		const { result } = setup({ joined: true, airGappedRemainingDays: undefined, footerMessage: 'preview-me' });

		expect(result.current).toEqual({ kind: 'preview', message: 'preview-me' });
	});

	it('returns composer by default', () => {
		const { result } = setup({ joined: true, airGappedRemainingDays: undefined, footerMessage: '' });

		expect(result.current).toEqual({ kind: 'composer' });
	});
});
