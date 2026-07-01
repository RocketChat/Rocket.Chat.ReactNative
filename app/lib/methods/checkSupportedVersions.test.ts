import { type ISupportedVersionsData, type TSVMessage } from '../../definitions';
import { checkSupportedVersions, getMessage } from './checkSupportedVersions';

const MOCK_I18N = {
	en: {
		message_token: 'Your server is about to be deprecated. Please update to the latest version.'
	}
};
const TODAY = '2023-04-01T00:00:00.000Z';
const MOCK: ISupportedVersionsData = {
	timestamp: TODAY,
	enforcementStartDate: TODAY,
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
	enforcementStartDate: TODAY,
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

jest.useFakeTimers();
jest.setSystemTime(new Date(TODAY));

describe('checkSupportedVersions', () => {
	describe('General', () => {
		test('ignore the patch and compare as minor', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK,
					serverVersion: '1.5.1'
				})
			).toMatchObject({
				status: 'supported'
			});
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK,
					serverVersion: '1.2.1'
				})
			).toMatchObject({
				status: 'expired'
			});
		});
	});

	describe('Built-in supported versions', () => {
		test('no supported versions', () => {
			expect(checkSupportedVersions({ supportedVersions: undefined, serverVersion: '1.5.0' })).toMatchObject({
				status: 'supported'
			});
			expect(checkSupportedVersions({ supportedVersions: undefined, serverVersion: '1.1.0' })).toMatchObject({
				status: 'expired'
			});
		});

		test('deprecated version', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: { ...MOCK, timestamp: '2023-03-01T00:00:00.000Z' },
					serverVersion: '1.2.0'
				})
			).toMatchObject({
				status: 'expired'
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
					serverVersion: '1.5.0'
				})
			).toMatchObject({
				status: 'supported'
			});
		});

		test('warning version', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK,
					serverVersion: '1.4.0'
				})
			).toMatchObject({
				status: 'warn',
				message: {
					remainingDays: 15,
					title: 'message_token',
					subtitle: 'message_token',
					description: 'message_token',
					type: 'info',
					link: 'Docs page'
				},
				i18n: MOCK_I18N
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
				status: 'expired'
			});
		});

		test('expired version and no exception', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK,
					serverVersion: '1.1.0'
				})
			).toMatchObject({
				status: 'expired'
			});
		});

		test('server version is not supported', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: MOCK,
					serverVersion: '1.0.0'
				})
			).toMatchObject({
				status: 'expired'
			});
		});
	});

	describe('Messages', () => {
		const MOCK_MESSAGES: ISupportedVersionsData = {
			timestamp: TODAY,
			enforcementStartDate: TODAY,
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

	describe('role targeting', () => {
		const buildMessages = (roles?: string[]): TSVMessage[] => [
			{
				remainingDays: 15,
				title: 'targeted',
				subtitle: 'subtitle_token',
				description: 'description_token',
				type: 'info',
				...(roles ? { roles } : {}),
				link: 'Docs page'
			}
		];

		test('shows a message with no roles to every user', () => {
			expect(
				getMessage({ messages: buildMessages(), expiration: '2023-04-10T00:00:00.000Z', userRoles: ['user'] })
			).toMatchObject({ title: 'targeted' });
		});

		test('shows a role-targeted message when the user has the role', () => {
			expect(
				getMessage({ messages: buildMessages(['admin']), expiration: '2023-04-10T00:00:00.000Z', userRoles: ['admin', 'user'] })
			).toMatchObject({ title: 'targeted' });
		});

		test('hides a role-targeted message from users without the role', () => {
			expect(
				getMessage({ messages: buildMessages(['admin']), expiration: '2023-04-10T00:00:00.000Z', userRoles: ['user'] })
			).toBeUndefined();
		});

		test('hides a role-targeted message when user roles are unknown', () => {
			expect(getMessage({ messages: buildMessages(['admin']), expiration: '2023-04-10T00:00:00.000Z' })).toBeUndefined();
		});
	});
});

describe('checkSupportedVersions role targeting', () => {
	const buildSupportedVersions = (roles?: string[]): ISupportedVersionsData => ({
		timestamp: TODAY,
		enforcementStartDate: TODAY,
		messages: [
			{
				remainingDays: 15,
				title: 'targeted',
				subtitle: 'subtitle_token',
				description: 'description_token',
				type: 'info',
				...(roles ? { roles } : {}),
				link: 'Docs page'
			}
		],
		i18n: MOCK_I18N,
		versions: [
			{
				version: '1.4.0',
				expiration: '2023-04-10T00:00:00.000Z'
			}
		]
	});

	test('shows a role-targeted message when the user has the role', () => {
		expect(
			checkSupportedVersions({
				supportedVersions: buildSupportedVersions(['admin']),
				serverVersion: '1.4.0',
				userRoles: ['admin', 'user']
			})
		).toMatchObject({ status: 'warn', message: { title: 'targeted' } });
	});

	test('hides a role-targeted message from users without the role', () => {
		const result = checkSupportedVersions({
			supportedVersions: buildSupportedVersions(['admin']),
			serverVersion: '1.4.0',
			userRoles: ['user']
		});
		expect(result.status).toBe('supported');
		expect(result.message).toBeUndefined();
	});

	test('hides a role-targeted message when user roles are unknown', () => {
		const result = checkSupportedVersions({
			supportedVersions: buildSupportedVersions(['admin']),
			serverVersion: '1.4.0'
		});
		expect(result.status).toBe('supported');
		expect(result.message).toBeUndefined();
	});

	describe('enforcement window', () => {
		const buildEnforcementSupportedVersions = (roles?: string[]): ISupportedVersionsData => ({
			timestamp: TODAY,
			enforcementStartDate: '2023-04-15T00:00:00.000Z',
			messages: [
				{
					remainingDays: 15,
					title: 'targeted',
					subtitle: 'subtitle_token',
					description: 'description_token',
					type: 'info',
					...(roles ? { roles } : {}),
					link: 'Docs page'
				}
			],
			i18n: MOCK_I18N,
			versions: [
				{
					version: '1.4.0',
					expiration: '2023-03-10T00:00:00.000Z'
				}
			]
		});

		test('does not warn a non-targeted user during the enforcement grace window', () => {
			const result = checkSupportedVersions({
				supportedVersions: buildEnforcementSupportedVersions(['admin']),
				serverVersion: '1.4.0',
				userRoles: ['user']
			});
			expect(result.status).toBe('supported');
			expect(result.message).toBeUndefined();
		});

		test('warns a targeted user during the enforcement grace window', () => {
			expect(
				checkSupportedVersions({
					supportedVersions: buildEnforcementSupportedVersions(['admin']),
					serverVersion: '1.4.0',
					userRoles: ['admin']
				})
			).toMatchObject({ status: 'warn', message: { title: 'targeted' } });
		});
	});
});
