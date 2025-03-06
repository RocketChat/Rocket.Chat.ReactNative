import { ISupportedVersionsData } from '../../definitions';
import { checkSupportedVersions, getMessage } from './checkSupportedVersions';

const MOCK_I18N = {
	en: {
		message_token: 'Your server is about to be deprecated. Please update to the latest version.'
	}
};
const TODAY = '2023-04-01T00:00:00.000Z';
const MOCK: ISupportedVersionsData = {
	timestamp: TODAY,
	enforcementStartDate: '2023-04-02T00:00:00.000Z',
	messages: [
		{
			remainingDays: 15,
			title: 'message_token',
			subtitle: 'message_token',
			description: 'message_token',
			type: 'info',
			link: 'Docs page'
		}
	],
	i18n: MOCK_I18N,
	versions: [
		{
			version: '1.5.0',
			expiration: '2023-05-10T00:00:00.000Z'
		},
		{
			version: '2.4.0',
			expiration: '2023-04-10T00:00:00.000Z'
		},
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
				version: '2.4.0',
				expiration: '2023-05-01T00:00:00.000Z'
			},
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
	enforcementStartDate: '2023-04-02T00:00:00.000Z',
	i18n: {
		en: {
			builtin_i18n: 'Your server is about to be deprecated. Please update to the latest version.'
		}
	},
	messages: [
		{
			remainingDays: 15,
			title: 'builtin_i18n',
			subtitle: 'builtin_i18n',
			description: 'builtin_i18n',
			type: 'info',
			link: 'Docs page'
		}
	],
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

jest.useFakeTimers();
jest.setSystemTime(new Date(TODAY));

describe('checkSupportedVersions', () => {
	describe('Built-in supported versions', () => {
		test('no supported versions', () => {
			expect(checkSupportedVersions({ supportedVersions: undefined, serverVersion: '1.5.0' })).toMatchObject({
				status: 'supported'
			});
			expect(checkSupportedVersions({ supportedVersions: undefined, serverVersion: '1.1.0' })).toMatchObject({
				status: 'warn',
				i18n: {
					en: {
						builtin_i18n: 'Your server is about to be deprecated. Please update to the latest version.'
					}
				},
				message: {
					remainingDays: 15,
					title: 'builtin_i18n',
					subtitle: 'builtin_i18n',
					description: 'builtin_i18n',
					type: 'info',
					link: 'Docs page'
				}
			});
		});

		test('deprecated version', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: { ...MOCK, timestamp: '2023-03-01T00:00:00.000Z' },
					serverVersion: '1.2.0'
				})
			).toMatchObject({
				status: 'warn',
				i18n: {
					en: {
						builtin_i18n: 'Your server is about to be deprecated. Please update to the latest version.'
					}
				},
				message: {
					remainingDays: 15,
					title: 'builtin_i18n',
					subtitle: 'builtin_i18n',
					description: 'builtin_i18n',
					type: 'info',
					link: 'Docs page'
				}
			});
		});

		test('valid version', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: { ...MOCK, timestamp: '2023-03-01T00:00:00.000Z' },
					serverVersion: '1.5.0'
				})
			).toMatchObject({
				status: 'supported'
			});
		});

		test('valid version with message', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: { ...MOCK, timestamp: '2023-03-01T00:00:00.000Z' },
					serverVersion: '1.4.0'
				})
			).toMatchObject({
				status: 'warn',
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
				checkSupportedVersions({
					supportedVersions: MOCK,
					serverVersion: '1.4.0'
				})
			).toMatchObject({
				status: 'warn',
				i18n: MOCK_I18N,
				message: {
					remainingDays: 15,
					title: 'message_token',
					subtitle: 'message_token',
					description: 'message_token',
					type: 'info',
					link: 'Docs page'
				}
			});
		});

		test('valid version and valid exception', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK,
					serverVersion: '2.4.0'
				})
			).toMatchObject({
				status: 'supported'
			});
		});

		test('expired version and valid exception', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK,
					serverVersion: '1.3.0'
				})
			).toMatchObject({
				status: 'supported'
			});
		});

		test('expired version and expired exception', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK,
					serverVersion: '1.2.0'
				})
			).toMatchObject({
				status: 'warn',
				i18n: MOCK_I18N,
				message: {
					remainingDays: 15,
					title: 'message_token',
					subtitle: 'message_token',
					description: 'message_token',
					type: 'info',
					link: 'Docs page'
				}
			});
		});

		test('expired version and no exception', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK,
					serverVersion: '1.1.0'
				})
			).toMatchObject({
				status: 'warn',
				i18n: MOCK_I18N,
				message: {
					remainingDays: 15,
					title: 'message_token',
					subtitle: 'message_token',
					description: 'message_token',
					type: 'info',
					link: 'Docs page'
				}
			});
		});

		test('server version is not supported', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK,
					serverVersion: '1.0.0'
				})
			).toMatchObject({
				status: 'warn',
				i18n: MOCK_I18N,
				message: {
					remainingDays: 15,
					title: 'message_token',
					subtitle: 'message_token',
					description: 'message_token',
					type: 'info',
					link: 'Docs page'
				}
			});
		});
	});

	describe('Messages', () => {
		const MOCK_MESSAGES: ISupportedVersionsData = {
			timestamp: TODAY,
			enforcementStartDate: '2023-04-02T00:00:00.000Z',
			messages: [
				{
					remainingDays: 60,
					title: 'title_root',
					subtitle: 'subtitle_root',
					description: 'description_root',
					type: 'info',
					link: 'Docs page'
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
							title: 'title_version',
							subtitle: 'subtitle_version',
							description: 'description_version',
							type: 'info',
							link: 'Docs page'
						},
						{
							remainingDays: 30,
							title: 'title_version',
							subtitle: 'subtitle_version',
							description: 'description_version',
							type: 'info',
							link: 'Docs page'
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
						title: 'title_exception',
						subtitle: 'subtitle_exception',
						description: 'description_exception',
						type: 'info',
						link: 'Docs page'
					}
				],
				versions: [
					{
						version: '1.3.0',
						expiration: '2023-05-01T00:00:00.000Z',
						messages: [
							{
								remainingDays: 30,
								title: 'title_exception_version',
								subtitle: 'subtitle_exception_version',
								description: 'description_exception_version',
								type: 'info',
								link: 'Docs page'
							}
						]
					},
					{
						version: '1.2.0',
						expiration: '2023-04-10T00:00:00.000Z'
					}
				]
			}
		};

		test('from exception version', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK_MESSAGES,
					serverVersion: '1.3.0'
				})
			).toMatchObject({
				status: 'warn',
				message: {
					remainingDays: 30,
					title: 'title_exception_version',
					subtitle: 'subtitle_exception_version',
					description: 'description_exception_version',
					type: 'info',
					link: 'Docs page'
				}
			});
		});

		test('from exception', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK_MESSAGES,
					serverVersion: '1.2.0'
				})
			).toMatchObject({
				status: 'warn',
				message: {
					remainingDays: 15,
					title: 'title_exception',
					subtitle: 'subtitle_exception',
					description: 'description_exception',
					type: 'info',
					link: 'Docs page'
				}
			});
		});

		test('from supported version', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK_MESSAGES,
					serverVersion: '1.4.0'
				})
			).toMatchObject({
				status: 'warn',
				message: {
					remainingDays: 15,
					title: 'title_version',
					subtitle: 'subtitle_version',
					description: 'description_version',
					type: 'info',
					link: 'Docs page'
				},
				i18n: MOCK_I18N
			});
		});

		test('from root node', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK_MESSAGES,
					serverVersion: '1.5.0'
				})
			).toMatchObject({
				status: 'warn',
				message: {
					remainingDays: 60,
					title: 'title_root',
					subtitle: 'subtitle_root',
					description: 'description_root',
					type: 'info',
					link: 'Docs page'
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
						title: 'title_token',
						subtitle: 'subtitle_token',
						description: 'description_token',
						type: 'info',
						link: 'Docs page'
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
						title: 'title_token',
						subtitle: 'subtitle_token',
						description: 'description_token',
						type: 'info',
						link: 'Docs page'
					},
					{
						remainingDays: 10,
						title: 'title_token',
						subtitle: 'subtitle_token',
						description: 'description_token',
						type: 'info',
						link: 'Docs page'
					}
				],
				expiration: '2023-04-10T00:00:00.000Z'
			})
		).toMatchObject({
			remainingDays: 10,
			title: 'title_token',
			subtitle: 'subtitle_token',
			description: 'description_token',
			type: 'info',
			link: 'Docs page'
		});
	});
});
