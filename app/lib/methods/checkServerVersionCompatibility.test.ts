import { ISupportedVersions } from '../../definitions';
import { checkServerVersionCompatibility } from './checkServerVersionCompatibility';

const TODAY = '2023-04-01T00:00:00.000Z';
const MOCK: ISupportedVersions = {
	timestamp: TODAY,
	messages: [
		{
			remainingDays: 15,
			message: 'message_token',
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
			version: '1.4.0',
			expiration: '2023-04-10T00:00:00.000Z',
			messages: []
		},
		{
			version: '1.3.0',
			expiration: '2023-03-10T00:00:00.000Z'
		},
		{
			version: '1.2.0',
			expiration: '2023-02-10T00:00:00.000Z',
			messages: []
		},
		{
			version: '1.1.0',
			expiration: '2023-01-10T00:00:00.000Z'
		}
	],
	exceptions: {
		domain: 'https://open.rocket.chat',
		uniqueId: '123',
		// messages?: Messages[];
		versions: [
			{
				version: '1.3.0',
				expiration: '2023-05-01T00:00:00.000Z'
			},
			{
				version: '1.2.0',
				expiration: '2023-03-10T00:00:00.000Z',
				messages: []
			}
		]
	}
};

jest.mock('../../../app-supportedversions.json', () => ({
	timestamp: '2023-03-20T00:00:00.000Z',
	versions: [
		{
			version: '1.5.0',
			expiration: '2023-05-10T00:00:00.000Z'
		},
		{
			version: '1.4.0',
			expiration: '2023-04-10T00:00:00.000Z',
			messages: []
		},
		{
			version: '1.3.0',
			expiration: '2023-03-10T00:00:00.000Z',
			messages: []
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
		test('supported versions is undefined', () => {
			expect(checkServerVersionCompatibility({ supportedVersions: undefined, serverVersion: '1.5.0' })).toMatchObject({
				success: false
			});
		});

		test('ignore the patch and compare as minor', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK,
					serverVersion: '1.4.1'
				})
			).toMatchObject({
				success: true,
				messages: []
			});
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK,
					serverVersion: '1.2.1'
				})
			).toMatchObject({
				success: false,
				messages: []
			});
		});
	});

	describe('Built-in supported versions', () => {
		test('invalid version', () => {
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

		test('invalid version with message', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: { ...MOCK, timestamp: '2023-03-01T00:00:00.000Z' },
					serverVersion: '1.3.0'
				})
			).toMatchObject({
				success: false,
				messages: []
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
				messages: []
			});
		});
	});

	describe('Backend/Cloud and exceptions', () => {
		test('valid version with message', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK,
					serverVersion: '1.4.0'
				})
			).toMatchObject({
				success: true,
				messages: []
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
				success: false,
				messages: []
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

		it('server version is not supported', () => {
			expect(
				checkServerVersionCompatibility({
					supportedVersions: MOCK,
					serverVersion: '1.0.0'
				})
			).toMatchObject({
				success: false
			});
		});

		// TODO: missing test actual messages and order of priority
	});
});
