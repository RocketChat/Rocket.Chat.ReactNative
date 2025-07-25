import { serializeAsciiUrl } from '.';

const ASCIIUrl = 'https://чат24.рф';
const NonASCIIUrl = 'open.rocket.chat';
const ASCIIUrlSerialized = 'https://xn--24-6kc6exa.xn--p1ai';

describe('Serialize ASCII url on ios', () => {
	jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
	test('ASCII url', () => {
		const result = serializeAsciiUrl(ASCIIUrl);
		expect(result).toBe(ASCIIUrlSerialized);
	});
	test('Non ASCII url', () => {
		const result = serializeAsciiUrl(NonASCIIUrl);
		expect(result).toBe(NonASCIIUrl);
	});
});

describe('Serialize ASCII url on android', () => {
	jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
	// By default android converts ASCII addresses
	// test('ASCII url', () => {
	// 	const result = serializeAsciiUrl(ASCIIUrl);
	// 	expect(result).toBe('filename.png');
	// });
	test('Non ASCII url', () => {
		const result = serializeAsciiUrl(NonASCIIUrl);
		expect(result).toBe(NonASCIIUrl);
	});
});
