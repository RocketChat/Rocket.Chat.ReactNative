import { renderHook } from '@testing-library/react-native';

import I18n from '../../../../i18n';
import EventEmitterReal from '../../../../lib/methods/helpers/events';
import Navigation from '../../../../lib/navigation/appNavigation';
import { showErrorAlert } from '../../../../lib/methods/helpers/info';
import { type IRoomViewState } from '../../definitions';
import { useRoomRemoved } from '../useRoomRemoved';

jest.mock('../../../../lib/methods/helpers', () => ({ getRoomTitle: jest.fn(() => 'Room') }));
jest.mock('../../../../lib/navigation/appNavigation', () => ({ __esModule: true, default: { popToTop: jest.fn() } }));
jest.mock('../../../../lib/methods/helpers/info', () => ({ showErrorAlert: jest.fn() }));

let mockRoom: IRoomViewState['room'] = { rid: '', t: '' };
jest.mock('../../stores/RoomStore', () => ({
	peekRoomStore: () => ({ getState: () => ({ room: mockRoom }) })
}));

const mockPopToTop = Navigation.popToTop as jest.Mock;
const mockShowErrorAlert = showErrorAlert as jest.Mock;

const renderRoomRemoved = (rid: string | undefined, isMasterDetail: boolean, room: IRoomViewState['room']) => {
	mockRoom = room;
	return renderHook(() => useRoomRemoved(rid, isMasterDetail));
};

describe('useRoomRemoved', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('emits a popToTop navigation and error alert when the removed room matches the current rid', () => {
		renderRoomRemoved('rid-removed-alert', true, { rid: 'rid-removed-alert', t: 'c' });

		EventEmitterReal.emit('ROOM_REMOVED', { rid: 'rid-removed-alert' });

		expect(mockPopToTop).toHaveBeenCalledWith(true);
		expect(mockShowErrorAlert).toHaveBeenCalledWith(I18n.t('You_were_removed_from_channel', { channel: 'Room' }), I18n.t('Oops'));
	});

	it('does not show an error alert when the removed room is a livechat room', () => {
		renderRoomRemoved('rid-removed-livechat', false, { rid: 'rid-removed-livechat', t: 'l' });

		EventEmitterReal.emit('ROOM_REMOVED', { rid: 'rid-removed-livechat' });

		expect(mockPopToTop).toHaveBeenCalledWith(false);
		expect(mockShowErrorAlert).not.toHaveBeenCalled();
	});

	it('ignores room-removed events for a different rid', () => {
		renderRoomRemoved('rid-removed-ignore', false, { rid: 'rid-removed-ignore', t: 'c' });

		EventEmitterReal.emit('ROOM_REMOVED', { rid: 'some-other-rid' });

		expect(mockPopToTop).not.toHaveBeenCalled();
		expect(mockShowErrorAlert).not.toHaveBeenCalled();
	});
});
