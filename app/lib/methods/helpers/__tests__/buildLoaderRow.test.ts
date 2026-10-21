import { buildLoaderRow, getNewestLoadedTs } from '../buildLoaderRow';
import { MessageTypeLoad } from '../../../constants/messageTypeLoad';

const ANCHOR_MS = Date.UTC(2024, 0, 1, 12, 0, 0, 500);
const anchor = { _id: 'msg-1', rid: 'ROOM_ID', ts: new Date(ANCHOR_MS), msg: 'hello' };

describe('buildLoaderRow', () => {
	it.each([
		[MessageTypeLoad.MORE, -1],
		[MessageTypeLoad.PREVIOUS_CHUNK, -1],
		[MessageTypeLoad.NEXT_CHUNK, 1]
	])('stamps a %s row %i ms from its anchor', (type, offset) => {
		expect(buildLoaderRow(anchor, type).ts).toEqual(new Date(ANCHOR_MS + offset));
	});

	it('carries the id, room, type and text of its anchor', () => {
		expect(buildLoaderRow(anchor, MessageTypeLoad.PREVIOUS_CHUNK)).toMatchObject({
			_id: 'load-more-msg-1',
			rid: 'ROOM_ID',
			t: MessageTypeLoad.PREVIOUS_CHUNK,
			msg: 'hello'
		});
	});

	it('stores a Date even when the anchor ts is an ISO string', () => {
		const row = buildLoaderRow({ ...anchor, ts: new Date(ANCHOR_MS).toISOString() }, MessageTypeLoad.NEXT_CHUNK);

		expect(row.ts).toEqual(new Date(ANCHOR_MS + 1));
	});
});

describe('getNewestLoadedTs', () => {
	it('returns the ts of the message a Newer Loader was stamped from', () => {
		const newerLoader = buildLoaderRow(anchor, MessageTypeLoad.NEXT_CHUNK);

		expect(getNewestLoadedTs(newerLoader.ts as Date)).toEqual(anchor.ts);
	});
});
