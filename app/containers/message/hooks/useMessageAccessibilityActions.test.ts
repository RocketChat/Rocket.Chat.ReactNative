import { renderHook } from '@testing-library/react-native';

import { useMessageAccessibilityActions } from './useMessageAccessibilityActions';

describe('useMessageAccessibilityActions', () => {
	it('returns undefined when disabled', () => {
		const { result } = renderHook(() => useMessageAccessibilityActions(true));
		expect(result.current).toBeUndefined();
	});

	it('returns a showActions action when enabled', () => {
		const { result } = renderHook(() => useMessageAccessibilityActions(false));
		expect(result.current).toEqual([{ name: 'showActions', label: 'Show message actions' }]);
	});
});
