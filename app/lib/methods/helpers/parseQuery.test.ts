import parseQuery from './parseQuery';

describe('parseQuery', () => {
	it('preserves query values that contain equals signs', () => {
		expect(parseQuery('host=open.rocket.chat&token=abc==&type=auth')).toEqual({
			host: 'open.rocket.chat',
			token: 'abc==',
			type: 'auth'
		});
	});

	it('decodes plus signs and encoded equals signs in values', () => {
		expect(parseQuery('fullURL=https%3A%2F%2Fgo.rocket.chat%2Fauth%3Ftoken%3Da%252Bb%253D%253D&message=hello+world')).toEqual({
			fullURL: 'https://go.rocket.chat/auth?token=a%2Bb%3D%3D',
			message: 'hello world'
		});
	});
});
