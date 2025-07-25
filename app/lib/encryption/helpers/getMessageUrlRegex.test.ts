import { getMessageUrlRegex } from './getMessageUrlRegex';

describe('Should regex', () => {
	test('a common quote separated by space', () => {
		const quote = '[ ](https://open.rocket.chat/group/room?msg=rid) test';
		expect(quote.match(getMessageUrlRegex())).toStrictEqual(['https://open.rocket.chat/group/room?msg=rid']);
	});
	test('a quote separated by break line', () => {
		const quote = '[ ](https://open.rocket.chat/group/room?msg=rid)\ntest';
		expect(quote.match(getMessageUrlRegex())).toStrictEqual(['https://open.rocket.chat/group/room?msg=rid']);
	});
});
