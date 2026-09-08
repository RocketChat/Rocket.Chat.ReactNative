import { renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { useCanPlaceLivechatOnHold } from '../useCanPlaceLivechatOnHold';

let mockSetting = true;
jest.mock('../../../../lib/hooks/useSetting', () => ({ useSetting: () => mockSetting }));

let mockState = {
	room: { room: { rid: 'rid-1', t: 'l', onHold: false } },
	lastMessageFromAgent: true
};

describe('useCanPlaceLivechatOnHold', () => {
	const store = () => createStore(() => mockState) as any;
	beforeEach(() => {
		mockSetting = true;
		mockState = { room: { room: { rid: 'rid-1', t: 'l', onHold: false } }, lastMessageFromAgent: true };
	});

	it('allows on-hold when the setting is on, the agent spoke last and the room is not on hold', () => {
		expect(renderHook(() => useCanPlaceLivechatOnHold(store())).result.current).toBe(true);
	});

	it('denies on-hold when the room is already on hold', () => {
		mockState = { ...mockState, room: { room: { rid: 'rid-1', t: 'l', onHold: true } } };
		expect(renderHook(() => useCanPlaceLivechatOnHold(store())).result.current).toBe(false);
	});

	it('denies on-hold when the visitor spoke last', () => {
		mockState = { ...mockState, lastMessageFromAgent: false };
		expect(renderHook(() => useCanPlaceLivechatOnHold(store())).result.current).toBe(false);
	});

	it('denies on-hold when the setting is off', () => {
		mockSetting = false;
		expect(renderHook(() => useCanPlaceLivechatOnHold(store())).result.current).toBe(false);
	});

	it('denies on-hold outside livechat rooms', () => {
		mockState = { ...mockState, room: { room: { rid: 'rid-1', t: 'c', onHold: false } } };
		expect(renderHook(() => useCanPlaceLivechatOnHold(store())).result.current).toBe(false);
	});
});
