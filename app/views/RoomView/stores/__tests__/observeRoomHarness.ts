import database from '../../../../lib/database';

const mockGet = database.active.get as jest.Mock;

export const setupObserveRoomDatabase = () => {
	const callbacks = new Set<(rows: any[]) => void>();
	const observeWithColumns = jest.fn(() => ({
		subscribe: (callback: (rows: any[]) => void) => {
			callbacks.add(callback);
			return { unsubscribe: jest.fn(() => callbacks.delete(callback)) };
		}
	}));
	const query = jest.fn(() => ({ observeWithColumns }));
	mockGet.mockReturnValue({ query });
	return {
		observeWithColumns,
		query,
		emit: (rows: any[]) => callbacks.forEach(callback => callback(rows))
	};
};
