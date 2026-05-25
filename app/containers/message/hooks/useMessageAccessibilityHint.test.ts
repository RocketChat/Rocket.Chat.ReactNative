import { renderHook } from '@testing-library/react-native';

import { useMessageAccessibilityHint } from './useMessageAccessibilityHint';

describe('useMessageAccessibilityHint', () => {
	it('returns the view thread hint when the message has a thread', () => {
		const { result } = renderHook(() => useMessageAccessibilityHint({ tlm: new Date(), tcount: 1, isThreadRoom: false }));
		expect(result.current).toBe('Press to view thread');
	});

	it('returns undefined when there is no thread', () => {
		const { result } = renderHook(() => useMessageAccessibilityHint({ tlm: undefined, tcount: null, isThreadRoom: false }));
		expect(result.current).toBeUndefined();
	});

	it('returns undefined when rendered inside a thread room', () => {
		const { result } = renderHook(() => useMessageAccessibilityHint({ tlm: new Date(), tcount: 1, isThreadRoom: true }));
		expect(result.current).toBeUndefined();
	});
});
