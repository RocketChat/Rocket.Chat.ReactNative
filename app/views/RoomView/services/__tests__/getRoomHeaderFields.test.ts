import { getRoomHeaderFields } from '../getRoomHeaderFields';

describe('getRoomHeaderFields', () => {
	it('returns safe defaults for a preview Room', () => {
		expect(getRoomHeaderFields({ rid: 'rid-1', t: 'c' })).toEqual({
			teamMain: false,
			encrypted: undefined,
			departmentId: undefined
		});
	});

	it('preserves the header fields of a subscribed Room', () => {
		const room = { id: 'subscription-1', rid: 'rid-1', t: 'l', teamMain: true, encrypted: false, departmentId: 'department-1' };

		expect(getRoomHeaderFields(room)).toEqual({ teamMain: true, encrypted: false, departmentId: 'department-1' });
	});

	it('keeps preview encryption but does not treat a preview department as a Subscription field', () => {
		const room = { rid: 'rid-1', t: 'c', encrypted: true, departmentId: 'department-1' };

		expect(getRoomHeaderFields(room)).toEqual({ teamMain: false, encrypted: true, departmentId: undefined });
	});
});
