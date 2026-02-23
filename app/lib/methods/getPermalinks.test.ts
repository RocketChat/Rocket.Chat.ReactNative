import { buildPermalinkChannel, buildPermalinkMessage } from './getPermalinks';
import { SubscriptionType } from '../../definitions';

describe('buildPermalinkChannel', () => {
	test('normal_name', () => {
		expect(buildPermalinkChannel('https://server.com', { name: 'normal_name', rid: '123', t: SubscriptionType.CHANNEL })).toBe(
			'https://server.com/channel/normal_name'
		);
		expect(buildPermalinkChannel('https://server.com', { name: 'normal_name', rid: '123', t: SubscriptionType.GROUP })).toBe(
			'https://server.com/group/normal_name'
		);
		expect(buildPermalinkChannel('https://server.com', { name: 'normal_name', rid: '123', t: SubscriptionType.DIRECT })).toBe(
			'https://server.com/direct/normal_name'
		);
	});

	test('name with spaces', () => {
		expect(
			buildPermalinkChannel('https://server.com', { name: 'name with spaces', rid: '123', t: SubscriptionType.CHANNEL })
		).toBe('https://server.com/channel/name%20with%20spaces');
		expect(buildPermalinkChannel('https://server.com', { name: 'name with spaces', rid: '123', t: SubscriptionType.GROUP })).toBe(
			'https://server.com/group/name%20with%20spaces'
		);
		expect(
			buildPermalinkChannel('https://server.com', { name: 'name with spaces', rid: '123', t: SubscriptionType.DIRECT })
		).toBe('https://server.com/direct/name%20with%20spaces');
	});

	test('Русское название', () => {
		expect(
			buildPermalinkChannel('https://server.com', {
				name: 'Русское название с пробелами',
				rid: '123',
				t: SubscriptionType.CHANNEL
			})
		).toBe(
			'https://server.com/channel/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%BE%D0%B5%20%D0%BD%D0%B0%D0%B7%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%20%D1%81%20%D0%BF%D1%80%D0%BE%D0%B1%D0%B5%D0%BB%D0%B0%D0%BC%D0%B8'
		);
		expect(
			buildPermalinkChannel('https://server.com', { name: 'Русское название с пробелами', rid: '123', t: SubscriptionType.GROUP })
		).toBe(
			'https://server.com/group/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%BE%D0%B5%20%D0%BD%D0%B0%D0%B7%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%20%D1%81%20%D0%BF%D1%80%D0%BE%D0%B1%D0%B5%D0%BB%D0%B0%D0%BC%D0%B8'
		);
		expect(
			buildPermalinkChannel('https://server.com', {
				name: 'Русское название с пробелами',
				rid: '123',
				t: SubscriptionType.DIRECT
			})
		).toBe(
			'https://server.com/direct/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%BE%D0%B5%20%D0%BD%D0%B0%D0%B7%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%20%D1%81%20%D0%BF%D1%80%D0%BE%D0%B1%D0%B5%D0%BB%D0%B0%D0%BC%D0%B8'
		);
	});
});

describe('buildPermalinkMessage', () => {
	test('group chat', () => {
		expect(
			buildPermalinkMessage('https://server.com', true, { rid: '123', name: 'name', t: SubscriptionType.CHANNEL }, 'zxc')
		).toBe('https://server.com/channel/123?msg=zxc');
		expect(
			buildPermalinkMessage('https://server.com', true, { rid: '123', name: 'name', t: SubscriptionType.GROUP }, 'zxc')
		).toBe('https://server.com/group/123?msg=zxc');
		expect(
			buildPermalinkMessage('https://server.com', true, { rid: '123', name: 'name', t: SubscriptionType.DIRECT }, 'zxc')
		).toBe('https://server.com/direct/123?msg=zxc');
	});

	test('normal_name', () => {
		expect(
			buildPermalinkMessage('https://server.com', false, { rid: '123', name: 'normal_name', t: SubscriptionType.CHANNEL }, 'zxc')
		).toBe('https://server.com/channel/normal_name?msg=zxc');
		expect(
			buildPermalinkMessage('https://server.com', false, { rid: '123', name: 'normal_name', t: SubscriptionType.GROUP }, 'zxc')
		).toBe('https://server.com/group/normal_name?msg=zxc');
		expect(
			buildPermalinkMessage('https://server.com', false, { rid: '123', name: 'normal_name', t: SubscriptionType.DIRECT }, 'zxc')
		).toBe('https://server.com/direct/normal_name?msg=zxc');
	});

	test('name with spaces', () => {
		expect(
			buildPermalinkMessage(
				'https://server.com',
				false,
				{ rid: '123', name: 'name with spaces', t: SubscriptionType.CHANNEL },
				'zxc'
			)
		).toBe('https://server.com/channel/name%20with%20spaces?msg=zxc');
		expect(
			buildPermalinkMessage(
				'https://server.com',
				false,
				{ rid: '123', name: 'name with spaces', t: SubscriptionType.GROUP },
				'zxc'
			)
		).toBe('https://server.com/group/name%20with%20spaces?msg=zxc');
		expect(
			buildPermalinkMessage(
				'https://server.com',
				false,
				{ rid: '123', name: 'name with spaces', t: SubscriptionType.DIRECT },
				'zxc'
			)
		).toBe('https://server.com/direct/name%20with%20spaces?msg=zxc');
	});

	test('Русское название', () => {
		expect(
			buildPermalinkMessage(
				'https://server.com',
				false,
				{ rid: '123', name: 'Русское название с пробелами', t: SubscriptionType.CHANNEL },
				'zxc'
			)
		).toBe(
			'https://server.com/channel/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%BE%D0%B5%20%D0%BD%D0%B0%D0%B7%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%20%D1%81%20%D0%BF%D1%80%D0%BE%D0%B1%D0%B5%D0%BB%D0%B0%D0%BC%D0%B8?msg=zxc'
		);
		expect(
			buildPermalinkMessage(
				'https://server.com',
				false,
				{ rid: '123', name: 'Русское название с пробелами', t: SubscriptionType.GROUP },
				'zxc'
			)
		).toBe(
			'https://server.com/group/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%BE%D0%B5%20%D0%BD%D0%B0%D0%B7%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%20%D1%81%20%D0%BF%D1%80%D0%BE%D0%B1%D0%B5%D0%BB%D0%B0%D0%BC%D0%B8?msg=zxc'
		);
		expect(
			buildPermalinkMessage(
				'https://server.com',
				false,
				{ rid: '123', name: 'Русское название с пробелами', t: SubscriptionType.DIRECT },
				'zxc'
			)
		).toBe(
			'https://server.com/direct/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%BE%D0%B5%20%D0%BD%D0%B0%D0%B7%D0%B2%D0%B0%D0%BD%D0%B8%D0%B5%20%D1%81%20%D0%BF%D1%80%D0%BE%D0%B1%D0%B5%D0%BB%D0%B0%D0%BC%D0%B8?msg=zxc'
		);
	});
});
