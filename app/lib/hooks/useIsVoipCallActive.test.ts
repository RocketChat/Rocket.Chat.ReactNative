import { renderHook, act } from '@testing-library/react-native';

import { useIsVoipCallActive } from './useIsVoipCallActive';
import { useCallStore } from '../services/voip/useCallStore';

const mockCall = { callId: 'call-1' } as any;
const mockNativeId = 'native-call-id';

describe('useIsVoipCallActive', () => {
	beforeEach(() => {
		useCallStore.setState({ call: null, nativeAcceptedCallId: null });
	});

	afterEach(() => {
		useCallStore.setState({ call: null, nativeAcceptedCallId: null });
	});

	it('returns false when both call and nativeAcceptedCallId are null', () => {
		const { result } = renderHook(() => useIsVoipCallActive());
		expect(result.current).toBe(false);
	});

	it('returns true when call is set and nativeAcceptedCallId is null', () => {
		useCallStore.setState({ call: mockCall, nativeAcceptedCallId: null });
		const { result } = renderHook(() => useIsVoipCallActive());
		expect(result.current).toBe(true);
	});

	it('returns true when call is null and nativeAcceptedCallId is set', () => {
		useCallStore.setState({ call: null, nativeAcceptedCallId: mockNativeId });
		const { result } = renderHook(() => useIsVoipCallActive());
		expect(result.current).toBe(true);
	});

	it('returns true when both call and nativeAcceptedCallId are set', () => {
		useCallStore.setState({ call: mockCall, nativeAcceptedCallId: mockNativeId });
		const { result } = renderHook(() => useIsVoipCallActive());
		expect(result.current).toBe(true);
	});
});
