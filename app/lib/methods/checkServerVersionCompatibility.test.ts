import { ISupportedVersions } from '../../definitions';
import { checkServerVersionCompatibility, getMessage } from './checkServerVersionCompatibility';

const MOCK_I18N = {
	en: {
		message_token: 'Your server is about to be deprecated. Please update to the latest version.'
	}
};
const TODAY = '2023-04-01T00:00:00.000Z';
const MOCK: ISupportedVersions = {
	timestamp: TODAY,
	messages: [
		{
			remainingDays: 15,
			message: {
				title: 'title_token',
				subtitle: 'subtitle_token',
				description: 'description_token'
			},
			type: 'info'
		}
	],
	i18n: MOCK_I18N,
	versions: [
		{
			version: '1.4.0',
			expiration: '2023-04-10T00:00:00.000Z'
		},
		{
			version: '1.3.0',
			expiration: '2023-03-10T00:00:00.000Z'
		},
		{
			version: '1.2.0',
			expiration: '2023-02-10T00:00:00.000Z'
		},
		{
			version: '1.1.0',
			expiration: '2023-01-10T00:00:00.000Z'
		}
	],
	exceptions: {
		domain: 'https://open.rocket.chat',
		uniqueId: '123',
		versions: [
			{
				version: '1.3.0',
				expiration: '2023-05-01T00:00:00.000Z'
			},
			{
				version: '1.2.0',
				expiration: '2023-03-10T00:00:00.000Z'
			}
		]
	}
};

const MOCK_BUILTIN_I18N = {
	en: {
		builtin_i18n: 'Your server is about to be deprecated. Please update to the latest version.'
	}
};
jest.mock('../../../app-supportedversions.json', () => ({
	timestamp: '2023-04-01T00:00:00.000Z',
	i18n: {
		en: {
			builtin_i18n: 'Your server is about to be deprecated. Please update to the latest version.'
		}
	},
	versions: [
		{
			version: '1.5.0',
			expiration: '2023-05-10T00:00:00.000Z'
		},
		{
			version: '1.4.0',
			expiration: '2023-04-10T00:00:00.000Z',
			messages: [
				{
					remainingDays: 10,
					message: '1.4',
					type: 'info'
				}
			]
		},
		{
			version: '1.3.0',
			expiration: '2023-03-10T00:00:00.000Z',
			messages: [
				{
					remainingDays: 15,
					message: '1.3',
					type: 'info'
				}
			]
		},
		{
			version: '1.2.0',
			expiration: '2023-02-10T00:00:00.000Z'
		}
	]
}));

jest.useFakeTimers('modern');
jest.setSystemTime(new Date(TODAY));

describe('checkServerVersionCompatibility', () => {
	describe('General', () => {
		test('ignore the patch and compare as minor', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK,
					serverVersion: '1.4.1'
				})
			).toMatchObject({
				success: true
			});
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK,
					serverVersion: '1.2.1'
				})
			).toMatchObject({
				success: false
			});
		});
	});

	describe('Built-in supported versions', () => {
		test('no supported versions', () => {
			expect(checkServerVersionCompatibility({ supportedVersions: undefined, serverVersion: '1.5.0' })).toMatchObject({
				success: true
			});
			expect(checkServerVersionCompatibility({ supportedVersions: undefined, serverVersion: '1.1.0' })).toMatchObject({
				success: false
			});
		});

		test('deprecated version', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: { ...MOCK, timestamp: '2023-03-01T00:00:00.000Z' },
					serverVersion: '1.2.0'
				})
			).toMatchObject({
				success: false
			});
		});

		test('valid version', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: { ...MOCK, timestamp: '2023-03-01T00:00:00.000Z' },
					serverVersion: '1.5.0'
				})
			).toMatchObject({
				success: true
			});
		});

		test('valid version with message', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: { ...MOCK, timestamp: '2023-03-01T00:00:00.000Z' },
					serverVersion: '1.4.0'
				})
			).toMatchObject({
				success: true,
				message: {
					remainingDays: 10,
					message: '1.4',
					type: 'info'
				},
				i18n: MOCK_BUILTIN_I18N
			});
		});
	});

	describe('Backend/Cloud and exceptions', () => {
		test('valid version', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK,
					serverVersion: '1.4.0'
				})
			).toMatchObject({
				success: true
			});
		});

		test('expired version and valid exception', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK,
					serverVersion: '1.3.0'
				})
			).toMatchObject({
				success: true
			});
		});

		test('expired version and expired exception', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK,
					serverVersion: '1.2.0'
				})
			).toMatchObject({
				success: false
			});
		});

		test('expired version and no exception', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK,
					serverVersion: '1.1.0'
				})
			).toMatchObject({
				success: false
			});
		});

		test('server version is not supported', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK,
					serverVersion: '1.0.0'
				})
			).toMatchObject({
				success: false
			});
		});
	});

	describe('Messages', () => {
		const MOCK_MESSAGES: ISupportedVersions = {
			timestamp: TODAY,
			messages: [
				{
					remainingDays: 60,
					message: {
						title: 'title_root',
						subtitle: 'subtitle_root',
						description: 'description_root'
					},
					type: 'info'
				}
			],
			i18n: {
				en: {
					message_token: 'Your server is about to be deprecated. Please update to the latest version.'
				}
			},
			versions: [
				{
					version: '1.5.0',
					expiration: '2023-05-10T00:00:00.000Z'
				},
				{
					version: '1.4.0',
					expiration: '2023-04-10T00:00:00.000Z',
					messages: [
						{
							remainingDays: 15,
							message: {
								title: 'title_version',
								subtitle: 'subtitle_version',
								description: 'description_version'
							},
							type: 'info'
						},
						{
							remainingDays: 30,
							message: {
								title: 'title_version',
								subtitle: 'subtitle_version',
								description: 'description_version'
							},
							type: 'info'
						}
					]
				},
				{
					version: '1.3.0',
					expiration: '2023-03-10T00:00:00.000Z'
				},
				{
					version: '1.2.0',
					expiration: '2023-02-10T00:00:00.000Z'
				}
			],
			exceptions: {
				domain: 'https://open.rocket.chat',
				uniqueId: '123',
				messages: [
					{
						remainingDays: 15,
						message: {
							title: 'title_exception',
							subtitle: 'subtitle_exception',
							description: 'description_exception'
						},
						type: 'info'
					}
				],
				versions: [
					{
						version: '1.3.0',
						expiration: '2023-05-01T00:00:00.000Z',
						messages: [
							{
								remainingDays: 15,
								message: {
									title: 'title_exception_version',
									subtitle: 'subtitle_exception_version',
									description: 'description_exception_version'
								},
								type: 'info'
							}
						]
					},
					{
						version: '1.2.0',
						expiration: '2023-03-10T00:00:00.000Z'
					}
				]
			}
		};

		test('from exception version', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK_MESSAGES,
					serverVersion: '1.3.0'
				})
			).toMatchObject({
				success: true
			});
		});

		test('from exception', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK_MESSAGES,
					serverVersion: '1.2.0'
				})
			).toMatchObject({
				success: false
			});
		});

		test('from supported version', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK_MESSAGES,
					serverVersion: '1.4.0'
				})
			).toMatchObject({
				success: true,
				message: {
					remainingDays: 15,
					message: {
						title: 'title_version',
						subtitle: 'subtitle_version',
						description: 'description_version'
					},
					type: 'info'
				},
				i18n: MOCK_I18N
			});
		});

		test('from root node', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK_MESSAGES,
					serverVersion: '1.5.0'
				})
			).toMatchObject({
				success: true,
				message: {
					remainingDays: 60,
					message: {
						title: 'title_root',
						subtitle: 'subtitle_root',
						description: 'description_root'
					},
					type: 'info'
				},
				i18n: MOCK_I18N
			});
		});
	});
});

describe('getMessage', () => {
	test('no messages', () => {
		expect(getMessage({ messages: undefined, expiration: '2023-04-10T00:00:00.000Z' })).toBeUndefined();
	});

	test('no expiration or already expired', () => {
		expect(getMessage({ messages: undefined, expiration: undefined })).toBeUndefined();
		expect(getMessage({ messages: undefined, expiration: '2023-01-10T00:00:00.000Z' })).toBeUndefined();
	});

	test('receives a message that should not be triggered yet', () => {
		expect(
			getMessage({
				messages: [
					{
						remainingDays: 1,
						message: {
							title: 'title_token',
							subtitle: 'subtitle_token',
							description: 'description_token'
						},
						type: 'info'
					}
				],
				expiration: '2023-04-10T00:00:00.000Z'
			})
		).toBeUndefined();
	});

	test('receives two messages and returns the appropriate one', () => {
		expect(
			getMessage({
				messages: [
					{
						remainingDays: 11,
						message: {
							title: 'title_token',
							subtitle: 'subtitle_token',
							description: 'description_token'
						},
						type: 'info'
					},
					{
						remainingDays: 10,
						message: {
							title: 'title_token',
							subtitle: 'subtitle_token',
							description: 'description_token'
						},
						type: 'info'
					}
				],
				expiration: '2023-04-10T00:00:00.000Z'
			})
		).toMatchObject({
			remainingDays: 10,
			message: {
				title: 'title_token',
				subtitle: 'subtitle_token',
				description: 'description_token'
			},
			type: 'info'
		});
	});
});
