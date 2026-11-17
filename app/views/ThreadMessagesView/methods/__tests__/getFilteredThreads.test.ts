import { Filter } from '../../filters';
import { type TThreadRow } from '../../types';
import getFilteredThreads from '../getFilteredThreads';

const thread = (id: string, replies: string[]) => ({ id, replies }) as TThreadRow;

const followed = thread('followed', ['me', 'other']);
const unread = thread('unread', ['other']);
const read = thread('read', []);
const threads = [followed, unread, read];

describe('getFilteredThreads', () => {
	it('keeps every thread for All', () => {
		expect(getFilteredThreads(threads, 'me', { tunread: ['unread'] }, Filter.All)).toEqual(threads);
	});

	it('keeps threads the user replied to for Following', () => {
		expect(getFilteredThreads(threads, 'me', {}, Filter.Following)).toEqual([followed]);
	});

	it('keeps threads listed in tunread for Unread', () => {
		expect(getFilteredThreads(threads, 'me', { tunread: ['unread'] }, Filter.Unread)).toEqual([unread]);
	});

	it('shows no threads for Unread when the room has no unread threads', () => {
		expect(getFilteredThreads(threads, 'me', {}, Filter.Unread)).toEqual([]);
	});
});
