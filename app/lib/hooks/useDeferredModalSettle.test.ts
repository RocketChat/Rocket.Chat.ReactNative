import { renderHook } from '@testing-library/react-native';

import { useDeferredModalSettle } from './useDeferredModalSettle';

interface IRequest {
	submit?: () => void;
	cancel?: () => void;
}

describe('useDeferredModalSettle', () => {
	it('runs the deferred settle on onModalHide, exactly once', () => {
		const { result } = renderHook(() => useDeferredModalSettle<IRequest>());
		const submit = jest.fn();

		result.current.onShow({ submit });
		result.current.defer(submit);
		expect(submit).not.toHaveBeenCalled();

		result.current.onModalHide();
		expect(submit).toHaveBeenCalledTimes(1);

		// A later hide (e.g. re-fired animation callback) must not double-settle.
		result.current.onModalHide();
		expect(submit).toHaveBeenCalledTimes(1);
	});

	it('flushes a settle left pending mid-animation when a new request arrives', () => {
		const { result } = renderHook(() => useDeferredModalSettle<IRequest>());
		const submit = jest.fn();

		result.current.onShow({ submit });
		result.current.defer(submit);

		// New request before onModalHide consumed the previous settle.
		result.current.onShow({ submit: jest.fn() });
		expect(submit).toHaveBeenCalledTimes(1);

		// The old settle is consumed; hide must not re-run it.
		result.current.onModalHide();
		expect(submit).toHaveBeenCalledTimes(1);
	});

	it('cancels a previous request still awaiting input so its caller is not orphaned', () => {
		const { result } = renderHook(() => useDeferredModalSettle<IRequest>());
		const cancel = jest.fn();

		// Request 1 shown, user never submitted or canceled.
		result.current.onShow({ submit: jest.fn(), cancel });

		// Request 2 replaces it: request 1's promise must reject instead of hanging.
		result.current.onShow({ submit: jest.fn(), cancel: jest.fn() });
		expect(cancel).toHaveBeenCalledTimes(1);
	});

	it('does not cancel a request the user already settled', () => {
		const { result } = renderHook(() => useDeferredModalSettle<IRequest>());
		const submit = jest.fn();
		const cancel = jest.fn();

		result.current.onShow({ submit, cancel });
		result.current.defer(submit);

		result.current.onShow({ submit: jest.fn(), cancel: jest.fn() });
		expect(submit).toHaveBeenCalledTimes(1);
		expect(cancel).not.toHaveBeenCalled();
	});
});
