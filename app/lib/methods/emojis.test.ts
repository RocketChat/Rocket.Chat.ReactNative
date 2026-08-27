import database from '../database';
import { DEFAULT_EMOJIS } from '../constants/emojis/emojis';
import migrations from '../database/model/migrations';
import appSchema from '../database/schema/app';
import { addFrequentlyUsed, getFrequentlyUsedEmojis, searchEmojis } from './emojis';

jest.mock('../database', () => ({
	__esModule: true,
	default: {
		active: {
			get: jest.fn(),
			write: jest.fn()
		}
	}
}));
jest.mock('./helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const mockGet = database.active.get as jest.Mock;
const mockWrite = database.active.write as jest.Mock;

let mockFetch: jest.Mock;
let mockCreate: jest.Mock;
let mockQuery: jest.Mock;

beforeEach(() => {
	jest.clearAllMocks();
	mockFetch = jest.fn().mockResolvedValue([]);
	mockCreate = jest.fn();
	mockQuery = jest.fn(() => ({ fetch: mockFetch }));
	mockGet.mockReturnValue({ query: mockQuery, create: mockCreate });
	mockWrite.mockImplementation((cb: () => Promise<void>) => cb());
});

describe('addFrequentlyUsed', () => {
	it('creates a new row by querying content + is_custom and never sets the emoji as the id', async () => {
		mockFetch.mockResolvedValue([]);

		await addFrequentlyUsed({ name: '大丈夫', extension: 'png' });

		expect(mockQuery).toHaveBeenCalledTimes(1);
		expect(mockQuery.mock.calls[0]).toHaveLength(2);
		expect(mockCreate).toHaveBeenCalledTimes(1);

		const record: any = {};
		mockCreate.mock.calls[0][0](record);
		expect(record.content).toBe('大丈夫');
		expect(record.isCustom).toBe(true);
		expect(record.extension).toBe('png');
		expect(record.count).toBe(1);
		expect(record.id).toBeUndefined();
		expect(record._raw).toBeUndefined();
	});

	it('does not set a custom extension or id for a standard emoji', async () => {
		mockFetch.mockResolvedValue([]);

		await addFrequentlyUsed('grinning');

		const record: any = {};
		mockCreate.mock.calls[0][0](record);
		expect(record.content).toBe('grinning');
		expect(record.isCustom).toBe(false);
		expect(record.extension).toBeUndefined();
		expect(record.id).toBeUndefined();
	});

	it('increments count for an existing emoji instead of creating a duplicate', async () => {
		const existing: any = { count: 3 };
		existing.update = jest.fn((fn: (f: any) => void) => fn(existing));
		mockFetch.mockResolvedValue([existing]);

		await addFrequentlyUsed('grinning');

		expect(mockCreate).not.toHaveBeenCalled();
		expect(existing.update).toHaveBeenCalledTimes(1);
		expect(existing.count).toBe(4);
	});

	it('runs the existing-row lookup inside the serialized write so concurrent calls cannot both create', async () => {
		mockWrite.mockImplementation(() => Promise.resolve());

		await addFrequentlyUsed('grinning');

		expect(mockWrite).toHaveBeenCalledTimes(1);
		expect(mockQuery).not.toHaveBeenCalled();
		expect(mockFetch).not.toHaveBeenCalled();
	});
});

describe('getFrequentlyUsedEmojis', () => {
	it('maps standard and custom rows to the shapes the UI expects', async () => {
		mockFetch.mockResolvedValue([
			{ isCustom: false, content: 'grinning' },
			{ isCustom: true, content: 'rocketchat', extension: 'png' }
		]);

		const result = await getFrequentlyUsedEmojis();

		expect(result).toEqual(['grinning', { name: 'rocketchat', extension: 'png' }]);
	});

	it('returns an empty list instead of throwing when the native bridge desyncs', async () => {
		mockFetch.mockRejectedValue(
			new Error("Record ID frequently_used_emojis#大丈夫 was sent over the bridge, but it's not cached")
		);

		await expect(getFrequentlyUsedEmojis()).resolves.toEqual([]);
	});

	it('falls back to the default emojis on a bridge error when defaults are requested', async () => {
		mockFetch.mockRejectedValue(
			new Error("Record ID frequently_used_emojis#大丈夫 was sent over the bridge, but it's not cached")
		);

		await expect(getFrequentlyUsedEmojis(true)).resolves.toEqual(DEFAULT_EMOJIS);
	});
});

describe('searchEmojis', () => {
	it('matches the listed shortname', async () => {
		await expect(searchEmojis('ocean')).resolves.toContain('ocean');
	});

	it('matches an alias and returns the listed shortname instead of the alias', async () => {
		const result = await searchEmojis('water_wave');

		expect(result).toContain('ocean');
		expect(result).not.toContain('water_wave');
	});

	it('matches case insensitively, so the picker finds an emoji typed in caps', async () => {
		await expect(searchEmojis('WATER_WAVE')).resolves.toContain('ocean');
	});

	it('returns only custom emojis when no shortname matches', async () => {
		mockFetch.mockResolvedValue([{ name: 'rocketchat', extension: 'png' }]);

		await expect(searchEmojis('notanemoji')).resolves.toEqual([{ name: 'rocketchat', extension: 'png' }]);
	});
});

describe('frequently_used_emojis migration', () => {
	it('bumps the schema to v29 with a matching migration', () => {
		expect(appSchema.version).toBe(29);
		expect((migrations as any).maxVersion).toBe(29);
	});

	it('v29 deletes only legacy rows whose id contains a non-printable-ASCII character', () => {
		const v29 = (migrations as any).sortedMigrations.find((m: any) => m.toVersion === 29);
		expect(v29).toBeDefined();
		const sqls = (v29.steps as any[]).filter(s => s.type === 'sql').map(s => s.sql);
		expect(sqls.some(sql => /DELETE FROM frequently_used_emojis/i.test(sql) && /\[\^ -~\]/.test(sql))).toBe(true);
	});
});
