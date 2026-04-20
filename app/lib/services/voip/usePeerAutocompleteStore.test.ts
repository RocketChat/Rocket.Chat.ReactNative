import { renderHook, act } from '@testing-library/react-native';

import { usePeerAutocompleteStore } from './usePeerAutocompleteStore';
import type { TPeerItem } from './getPeerAutocompleteOptions';

const mockGetPeerAutocompleteOptions = jest.fn();

jest.mock('./getPeerAutocompleteOptions', () => ({
	getPeerAutocompleteOptions: (args: unknown) => mockGetPeerAutocompleteOptions(args)
}));

const userPeer: TPeerItem = {
	type: 'user',
	value: 'user-1',
	label: 'Alice Johnson',
	username: 'alice.johnson'
};

const auth = { username: 'me', sipEnabled: false };

const mockOptions: TPeerItem[] = [
	userPeer,
	{
		type: 'sip',
		value: '+5511999999999',
		label: '+55 11 99999-9999'
	}
];

describe('usePeerAutocompleteStore', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		usePeerAutocompleteStore.setState({
			options: [],
			selectedPeer: null,
			filter: ''
		});
		mockGetPeerAutocompleteOptions.mockResolvedValue(mockOptions);
	});

	describe('reset', () => {
		it('should clear options, selected peer and filter', () => {
			usePeerAutocompleteStore.setState({
				filter: 'x',
				options: mockOptions,
				selectedPeer: userPeer
			});
			const { result } = renderHook(() => usePeerAutocompleteStore());

			act(() => {
				result.current.reset();
			});

			expect(usePeerAutocompleteStore.getState()).toMatchObject({
				options: [],
				selectedPeer: null,
				filter: ''
			});
		});
	});

	describe('setSelectedPeer', () => {
		it('should set selected peer', () => {
			const { result } = renderHook(() => usePeerAutocompleteStore());

			act(() => {
				result.current.setSelectedPeer(userPeer);
			});

			expect(usePeerAutocompleteStore.getState().selectedPeer).toEqual(userPeer);
		});

		it('should clear selected peer and options when null is passed without clearing filter', () => {
			usePeerAutocompleteStore.setState({ selectedPeer: userPeer, filter: 'keep', options: mockOptions });
			const { result } = renderHook(() => usePeerAutocompleteStore());

			act(() => {
				result.current.setSelectedPeer(null);
			});

			expect(usePeerAutocompleteStore.getState().selectedPeer).toBeNull();
			expect(usePeerAutocompleteStore.getState().filter).toBe('keep');
			expect(usePeerAutocompleteStore.getState().options).toEqual([]);
		});

		it('should clear filter and options when selecting a peer', () => {
			usePeerAutocompleteStore.setState({ filter: 'q', options: mockOptions, selectedPeer: null });
			const { result } = renderHook(() => usePeerAutocompleteStore());

			act(() => {
				result.current.setSelectedPeer(userPeer);
			});

			expect(usePeerAutocompleteStore.getState().selectedPeer).toEqual(userPeer);
			expect(usePeerAutocompleteStore.getState().filter).toBe('');
			expect(usePeerAutocompleteStore.getState().options).toEqual([]);
		});

		it('should invalidate in-flight fetchOptions when a peer is selected', async () => {
			let resolveSlow: (options: TPeerItem[]) => void = () => {};
			const slowPromise = new Promise<TPeerItem[]>(res => {
				resolveSlow = res;
			});
			mockGetPeerAutocompleteOptions.mockReturnValueOnce(slowPromise);

			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				const inFlight = result.current.fetchOptions('slow', auth);
				result.current.setSelectedPeer(userPeer);
				resolveSlow([{ type: 'sip', value: 'stale', label: 'stale' }]);
				await inFlight;
			});

			expect(usePeerAutocompleteStore.getState().options).toEqual([]);
			expect(usePeerAutocompleteStore.getState().selectedPeer).toEqual(userPeer);
		});

		it('should invalidate in-flight fetchOptions when selection is cleared', async () => {
			let resolveSlow: (options: TPeerItem[]) => void = () => {};
			const slowPromise = new Promise<TPeerItem[]>(res => {
				resolveSlow = res;
			});
			mockGetPeerAutocompleteOptions.mockReturnValueOnce(slowPromise);

			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				const inFlight = result.current.fetchOptions('slow', auth);
				result.current.setSelectedPeer(null);
				resolveSlow([{ type: 'sip', value: 'stale', label: 'stale' }]);
				await inFlight;
			});

			expect(usePeerAutocompleteStore.getState().options).toEqual([]);
			expect(usePeerAutocompleteStore.getState().selectedPeer).toBeNull();
		});
	});

	describe('setFilter', () => {
		it('should update filter and clear selectedPeer and options', () => {
			usePeerAutocompleteStore.setState({ filter: 'old', selectedPeer: userPeer, options: mockOptions });
			const { result } = renderHook(() => usePeerAutocompleteStore());

			act(() => {
				result.current.setFilter('new');
			});

			expect(usePeerAutocompleteStore.getState()).toMatchObject({
				filter: 'new',
				selectedPeer: null,
				options: []
			});
		});

		it('should invalidate in-flight fetchOptions so stale responses cannot repopulate', async () => {
			let resolveSlow: (options: TPeerItem[]) => void = () => {};
			const slowPromise = new Promise<TPeerItem[]>(res => {
				resolveSlow = res;
			});
			mockGetPeerAutocompleteOptions.mockReturnValueOnce(slowPromise);

			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				const inFlight = result.current.fetchOptions('slow', auth);
				result.current.setFilter('fast');
				resolveSlow([{ type: 'sip', value: 'stale', label: 'stale' }]);
				await inFlight;
			});

			expect(usePeerAutocompleteStore.getState().options).toEqual([]);
			expect(usePeerAutocompleteStore.getState().filter).toBe('fast');
		});
	});

	describe('fetchOptions', () => {
		it('should set empty options when filter is empty', async () => {
			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				await result.current.fetchOptions('', auth);
			});

			expect(usePeerAutocompleteStore.getState().options).toEqual([]);
			expect(mockGetPeerAutocompleteOptions).not.toHaveBeenCalled();
		});

		it('should set empty options when filter is only whitespace', async () => {
			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				await result.current.fetchOptions('   ', auth);
			});

			expect(usePeerAutocompleteStore.getState().options).toEqual([]);
			expect(mockGetPeerAutocompleteOptions).not.toHaveBeenCalled();
		});

		it('should fetch and set options when filter has value', async () => {
			usePeerAutocompleteStore.setState({ filter: 'alice' });
			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				await result.current.fetchOptions('alice', auth);
			});

			expect(mockGetPeerAutocompleteOptions).toHaveBeenCalledWith({
				filter: 'alice',
				peerInfo: null,
				username: 'me',
				sipEnabled: false
			});
			expect(usePeerAutocompleteStore.getState().options).toEqual(mockOptions);
		});

		it('should forward the current username so the service can exclude self', async () => {
			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				await result.current.fetchOptions('bob', { username: 'current.user', sipEnabled: false });
			});

			expect(mockGetPeerAutocompleteOptions).toHaveBeenCalledWith({
				filter: 'bob',
				peerInfo: null,
				username: 'current.user',
				sipEnabled: false
			});
		});

		it('should trim the filter before passing to the service', async () => {
			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				await result.current.fetchOptions('  alice  ', auth);
			});

			expect(mockGetPeerAutocompleteOptions).toHaveBeenCalledWith({
				filter: 'alice',
				peerInfo: null,
				username: 'me',
				sipEnabled: false
			});
		});

		it('should pass selected peer to getPeerAutocompleteOptions', async () => {
			usePeerAutocompleteStore.setState({ selectedPeer: userPeer, filter: 'bob' });
			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				await result.current.fetchOptions('bob', { username: 'x', sipEnabled: true });
			});

			expect(mockGetPeerAutocompleteOptions).toHaveBeenCalledWith({
				filter: 'bob',
				peerInfo: userPeer,
				username: 'x',
				sipEnabled: true
			});
		});

		it('should set empty options on fetch error when filter unchanged', async () => {
			mockGetPeerAutocompleteOptions.mockRejectedValue(new Error('API error'));
			usePeerAutocompleteStore.setState({ filter: 'alice' });
			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				await result.current.fetchOptions('alice', auth);
			});

			expect(usePeerAutocompleteStore.getState().options).toEqual([]);
		});

		it('should not apply stale results when filter changes before response resolves', async () => {
			let resolveSlow!: (value: TPeerItem[]) => void;
			const slowPromise = new Promise<TPeerItem[]>(res => {
				resolveSlow = res;
			});

			mockGetPeerAutocompleteOptions.mockReturnValueOnce(slowPromise);
			mockGetPeerAutocompleteOptions.mockResolvedValueOnce([{ type: 'sip', value: 'fast', label: 'fast' }]);

			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				usePeerAutocompleteStore.setState({ filter: 'slow', selectedPeer: null });
				const slowReq = result.current.fetchOptions('slow', auth);
				usePeerAutocompleteStore.setState({ filter: 'fast' });
				await result.current.fetchOptions('fast', auth);
				resolveSlow([{ type: 'sip', value: 'stale', label: 'stale' }]);
				await slowReq;
			});

			expect(usePeerAutocompleteStore.getState().options).toEqual([{ type: 'sip', value: 'fast', label: 'fast' }]);
		});
	});
});
