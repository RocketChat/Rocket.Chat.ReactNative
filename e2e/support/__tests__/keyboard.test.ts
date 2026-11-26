import type { Fixtures } from '../flows';
import { moveFocusTo } from '../keyboard';

const mockToBeFocused = jest.fn();
const mockAdb = jest.fn((..._args: string[]) => Promise.resolve());

jest.mock('e2e', () => ({
	expect: () => ({ toBeFocused: mockToBeFocused })
}));
jest.mock('e2e/engine', () => ({ TestError: class extends Error {} }));
jest.mock('../adb', () => ({ adb: (...args: string[]) => mockAdb(...args) }));
jest.mock('../timing', () => ({ delay: () => Promise.resolve() }));

const failure = (code: string, cause?: unknown) => Object.assign(new Error(code), { code, cause });
const hungRead = () => failure('ACTION_FAILED', failure('OPERATION_TIMEOUT'));
const assertionMiss = () => failure('ASSERTION_FAILED');

const setup = () => {
	const target = {};
	const noFocusedWrapper = { filter: () => ({ count: () => Promise.resolve(0) }) };
	const screen = { getByTestId: () => target };
	const device = { locator: () => noFocusedWrapper };
	return { screen, device } as unknown as Fixtures;
};

const keyPresses = () => mockAdb.mock.calls.filter(args => args.includes('keyevent')).length;

beforeEach(() => {
	jest.clearAllMocks();
	mockToBeFocused.mockReset();
});

describe('moveFocusTo', () => {
	it('reads focus again without pressing a key after a read that hung', async () => {
		mockToBeFocused.mockRejectedValueOnce(hungRead()).mockResolvedValueOnce(undefined);
		await moveFocusTo(setup(), 'target');
		expect(keyPresses()).toBe(0);
	});

	it('presses the key after a focus read that missed', async () => {
		mockToBeFocused.mockRejectedValueOnce(assertionMiss()).mockResolvedValueOnce(undefined);
		await moveFocusTo(setup(), 'target');
		expect(keyPresses()).toBe(1);
	});
});
