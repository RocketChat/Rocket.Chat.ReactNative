import { renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { useCanPlaceLivechatOnHold } from '../useCanPlaceLivechatOnHold';

let mockSetting = true;
jest.mock('../../../../lib/hooks/useSetting', () => ({ useSetting: () => mockSetting }));

type TMockRoom = { rid: string; t: string; onHold?: boolean; lastMessage?: { u?: unknown; token?: string } };

let mockState: { room: TMockRoom };

const store = () => createStore(() => mockState) as any;

describe('useCanPlaceLivechatOnHold', () => {
	beforeEach(() => {
		mockSetting = true;
		mockState = {
			room: { rid: 'rid-1', t: 'l', onHold: false, lastMessage: { u: { _id: 'agent-1' } } }
		};
	});

	it('allows on-hold when the setting is on, the agent spoke last and the room is not on hold', () => {
		expect(renderHook(() => useCanPlaceLivechatOnHold(store())).result.current).toBe(true);
	});

	it('denies on-hold when the room is already on hold', () => {
		mockState = { room: { ...mockState.room, onHold: true } };
		expect(renderHook(() => useCanPlaceLivechatOnHold(store())).result.current).toBe(false);
	});

	it('denies on-hold when the visitor spoke last', () => {
		mockState = { room: { ...mockState.room, lastMessage: { u: { _id: 'visitor-1' }, token: 'visitor-token' } } };
		expect(renderHook(() => useCanPlaceLivechatOnHold(store())).result.current).toBe(false);
	});

	it('denies on-hold when there is no last message', () => {
		mockState = { room: { ...mockState.room, lastMessage: undefined } };
		expect(renderHook(() => useCanPlaceLivechatOnHold(store())).result.current).toBe(false);
	});

	it('denies on-hold when the setting is off', () => {
		mockSetting = false;
		expect(renderHook(() => useCanPlaceLivechatOnHold(store())).result.current).toBe(false);
	});

	it('denies on-hold outside livechat rooms', () => {
		mockState = { room: { ...mockState.room, t: 'c' } };
		expect(renderHook(() => useCanPlaceLivechatOnHold(store())).result.current).toBe(false);
	});
});
