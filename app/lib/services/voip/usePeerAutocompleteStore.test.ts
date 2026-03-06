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

	describe('setSelectedPeer', () => {
		it('should set selected peer', () => {
			const { result } = renderHook(() => usePeerAutocompleteStore());

			act(() => {
				result.current.setSelectedPeer(userPeer);
			});

			expect(usePeerAutocompleteStore.getState().selectedPeer).toEqual(userPeer);
		});

		it('should clear selected peer when null is passed', () => {
			usePeerAutocompleteStore.setState({ selectedPeer: userPeer });
			const { result } = renderHook(() => usePeerAutocompleteStore());

			act(() => {
				result.current.setSelectedPeer(null);
			});

			expect(usePeerAutocompleteStore.getState().selectedPeer).toBeNull();
		});
	});

	describe('setFilter', () => {
		it('should set filter value', () => {
			const { result } = renderHook(() => usePeerAutocompleteStore());

			act(() => {
				result.current.setFilter('alice');
			});

			expect(usePeerAutocompleteStore.getState().filter).toBe('alice');
		});
	});

	describe('clearSelection', () => {
		it('should clear selected peer', () => {
			usePeerAutocompleteStore.setState({ selectedPeer: userPeer });
			const { result } = renderHook(() => usePeerAutocompleteStore());

			act(() => {
				result.current.clearSelection();
			});

			expect(usePeerAutocompleteStore.getState().selectedPeer).toBeNull();
		});
	});

	describe('fetchOptions', () => {
		it('should set empty options when filter is empty', async () => {
			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				await result.current.fetchOptions('');
			});

			expect(usePeerAutocompleteStore.getState().options).toEqual([]);
			expect(mockGetPeerAutocompleteOptions).not.toHaveBeenCalled();
		});

		it('should set empty options when filter is only whitespace', async () => {
			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				await result.current.fetchOptions('   ');
			});

			expect(usePeerAutocompleteStore.getState().options).toEqual([]);
			expect(mockGetPeerAutocompleteOptions).not.toHaveBeenCalled();
		});

		it('should fetch and set options when filter has value', async () => {
			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				await result.current.fetchOptions('alice');
			});

			expect(mockGetPeerAutocompleteOptions).toHaveBeenCalledWith({
				filter: 'alice',
				peerInfo: null
			});
			expect(usePeerAutocompleteStore.getState().options).toEqual(mockOptions);
		});

		it('should pass selected peer to getPeerAutocompleteOptions', async () => {
			usePeerAutocompleteStore.setState({ selectedPeer: userPeer });
			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				await result.current.fetchOptions('bob');
			});

			expect(mockGetPeerAutocompleteOptions).toHaveBeenCalledWith({
				filter: 'bob',
				peerInfo: userPeer
			});
		});

		it('should set empty options on fetch error', async () => {
			mockGetPeerAutocompleteOptions.mockRejectedValue(new Error('API error'));

			const { result } = renderHook(() => usePeerAutocompleteStore());

			await act(async () => {
				await result.current.fetchOptions('alice');
			});

			expect(usePeerAutocompleteStore.getState().options).toEqual([]);
		});
	});
});
