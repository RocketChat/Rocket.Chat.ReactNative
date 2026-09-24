import { renderHook, waitFor } from '@testing-library/react-native';

import { hasPermission } from '~/lib/methods/helpers';
import { useMessageActionPermissions } from '../useMessageActionOptions';

jest.mock('~/lib/methods/helpers', () => ({
	...jest.requireActual('~/lib/methods/helpers'),
	hasPermission: jest.fn()
}));

const mockedHasPermission = jest.mocked(hasPermission);
const editPermission = ['admin'];
const deletePermission = ['owner'];

describe('useMessageActionPermissions', () => {
	beforeEach(() => {
		mockedHasPermission.mockReset();
		mockedHasPermission.mockResolvedValue([true, false, false, true, false, false, false]);
	});

	it('maps the permission results', async () => {
		const { result } = renderHook(() => useMessageActionPermissions([editPermission, deletePermission], 'rid'));

		await waitFor(() => expect(result.current.hasEditPermission).toBe(true));
		expect(result.current.hasPinPermission).toBe(true);
		expect(result.current.hasDeletePermission).toBe(false);
	});

	it('loads once when rerendered with a new list holding the same permissions', async () => {
		const { result, rerender } = renderHook(() => useMessageActionPermissions([editPermission, deletePermission], 'rid'));

		await waitFor(() => expect(result.current.hasEditPermission).toBe(true));
		rerender({});
		rerender({});

		expect(mockedHasPermission).toHaveBeenCalledTimes(1);
	});

	it('reloads when the room changes', async () => {
		const { result, rerender } = renderHook(({ rid }: { rid: string }) => useMessageActionPermissions([editPermission], rid), {
			initialProps: { rid: 'first' }
		});

		await waitFor(() => expect(result.current.hasEditPermission).toBe(true));
		rerender({ rid: 'second' });

		await waitFor(() => expect(mockedHasPermission).toHaveBeenCalledTimes(2));
		expect(mockedHasPermission).toHaveBeenLastCalledWith(expect.any(Array), 'second');
	});
});
