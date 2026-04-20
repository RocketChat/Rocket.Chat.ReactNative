import { parseStringToIceServers } from './parseStringToIceServers';

describe('parseStringToIceServers', () => {
	it('returns empty array for empty input', () => {
		expect(parseStringToIceServers('')).toEqual([]);
	});

	it('returns empty array for whitespace-only input', () => {
		expect(parseStringToIceServers('   ')).toEqual([]);
	});

	it('parses STUN-only server', () => {
		expect(parseStringToIceServers('stun:stun.example.com:3478')).toEqual([{ urls: 'stun:stun.example.com:3478' }]);
	});

	it('parses TURN server with username and credential', () => {
		const input = 'user:secret@turn:turn.example.com:3478?transport=udp';
		expect(parseStringToIceServers(input)).toEqual([
			{
				urls: 'turn:turn.example.com:3478?transport=udp',
				username: 'user',
				credential: 'secret'
			}
		]);
	});

	it('decodes URI-encoded username and credential', () => {
		const user = encodeURIComponent('user:with:colons');
		const cred = encodeURIComponent('p@ss/word');
		const input = `${user}:${cred}@turns:turn.example.com:5349`;
		expect(parseStringToIceServers(input)).toEqual([
			{
				urls: 'turns:turn.example.com:5349',
				username: 'user:with:colons',
				credential: 'p@ss/word'
			}
		]);
	});

	it('parses comma-separated list', () => {
		const a = 'stun:stun1.example.com';
		const b = 'u:p@turn:turn.example.com';
		expect(parseStringToIceServers(`${a},${b}`)).toEqual([
			{ urls: a },
			{ urls: 'turn:turn.example.com', username: 'u', credential: 'p' }
		]);
	});

	it('tolerates malformed tokens without throwing', () => {
		expect(parseStringToIceServers('@@@')).toEqual([{ urls: '' }]);
	});
});
