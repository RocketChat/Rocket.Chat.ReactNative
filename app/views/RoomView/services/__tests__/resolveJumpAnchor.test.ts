import { MessageTypeLoad } from '../../../../lib/constants/messageTypeLoad';
import { resolveJumpAnchor } from '../resolveJumpAnchor';
import { type IJumpAnchorDeps, type IJumpTarget } from '../resolveJumpAnchor';

const makeTarget = (overrides: Partial<IJumpTarget> = {}): IJumpTarget => ({
	id: 'msg-1',
	ts: 1000,
	...overrides
});

const makeDeps = (overrides: Partial<IJumpAnchorDeps> = {}): IJumpAnchorDeps => ({
	loadSurroundingMessages: jest.fn().mockResolvedValue([]),
	getLocalAnchorTs: jest.fn().mockResolvedValue(null),
	...overrides
});

describe('resolveJumpAnchor', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns null for a thread message — neither dep called', async () => {
		const deps = makeDeps();
		const result = await resolveJumpAnchor('ROOM', makeTarget({ tmid: 'thread-parent' }), false, deps);
		expect(result).toBeNull();
		expect(deps.loadSurroundingMessages).not.toHaveBeenCalled();
		expect(deps.getLocalAnchorTs).not.toHaveBeenCalled();
	});

	it('returns null when rid is undefined — neither dep called', async () => {
		const deps = makeDeps();
		const result = await resolveJumpAnchor(undefined, makeTarget(), false, deps);
		expect(result).toBeNull();
		expect(deps.loadSurroundingMessages).not.toHaveBeenCalled();
		expect(deps.getLocalAnchorTs).not.toHaveBeenCalled();
	});

	it('returns null when the target is already in window — neither dep called', async () => {
		const deps = makeDeps();
		const result = await resolveJumpAnchor('ROOM', makeTarget(), true, deps);
		expect(result).toBeNull();
		expect(deps.loadSurroundingMessages).not.toHaveBeenCalled();
		expect(deps.getLocalAnchorTs).not.toHaveBeenCalled();
	});

	it('fromServer: returns the Newer Loader ts when one brackets the target — getLocalAnchorTs not called', async () => {
		const deps = makeDeps({
			loadSurroundingMessages: jest.fn().mockResolvedValue([
				{ _id: 'msg-1', t: undefined, ts: 1000 },
				{ _id: 'next-loader', t: MessageTypeLoad.NEXT_CHUNK, ts: 2000 }
			])
		});
		const result = await resolveJumpAnchor('ROOM', makeTarget({ fromServer: true }), false, deps);
		expect(result).toBe(2000);
		expect(deps.getLocalAnchorTs).not.toHaveBeenCalled();
	});

	it('fromServer: returns null when the Chunk is contiguous with the Live Tail (no Newer Loader above target)', async () => {
		const deps = makeDeps({
			loadSurroundingMessages: jest.fn().mockResolvedValue([
				{ _id: 'older', t: undefined, ts: 500 },
				{ _id: 'msg-1', t: undefined, ts: 1000 }
			])
		});
		const result = await resolveJumpAnchor('ROOM', makeTarget({ fromServer: true }), false, deps);
		expect(result).toBeNull();
	});

	it('fromServer: anchors at target ts when the Chunk is empty — target absent means not in Live Tail', async () => {
		const deps = makeDeps({
			loadSurroundingMessages: jest.fn().mockResolvedValue([])
		});
		const result = await resolveJumpAnchor('ROOM', makeTarget({ ts: 1000, fromServer: true }), false, deps);
		expect(result).toBe(1000);
	});

	it('cached out-of-window: returns the bracketing loader ts from getLocalAnchorTs — loadSurroundingMessages not called', async () => {
		const deps = makeDeps({
			getLocalAnchorTs: jest.fn().mockResolvedValue(3000)
		});
		const result = await resolveJumpAnchor('ROOM', makeTarget({ fromServer: false }), false, deps);
		expect(result).toBe(3000);
		expect(deps.loadSurroundingMessages).not.toHaveBeenCalled();
	});

	it('cached out-of-window, no bracketing loader: returns the target own ts (ms) as fallback', async () => {
		const deps = makeDeps({
			getLocalAnchorTs: jest.fn().mockResolvedValue(null)
		});
		const result = await resolveJumpAnchor('ROOM', makeTarget({ ts: 1000, fromServer: false }), false, deps);
		expect(result).toBe(1000);
	});
});
