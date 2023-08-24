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
		// messages?: Messages[];
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

jest.mock('../../../app-supportedversions.json', () => ({
	timestamp: '2023-03-20T00:00:00.000Z',
	versions: [
		{
			version: '1.5.0',
			expiration: '2023-05-10T00:00:00.000Z'
		},
		{
			version: '1.4.0',
			expiration: '2023-04-10T00:00:00.000Z'
		}
	]
}));

jest.useFakeTimers('modern');
jest.setSystemTime(new Date(TODAY));

describe('checkServerVersionCompatibility', () => {
	it('should return false if supported versions is undefined', () => {
		expect(checkServerVersionCompatibility({ supportedVersions: undefined, serverVersion: '1.5.0' })).toBe(false);
	});

	it('should return false using built-in supported versions comparison for an invalid version', () => {
		expect(
			checkServerVersionCompatibility({
				supportedVersions: { ...MOCK, timestamp: '2023-03-01T00:00:00.000Z' },
				serverVersion: '1.3.0'
			})
		).toBe(false);
	});

	it('should return true using built-in supported versions comparison for a valid version', () => {
		expect(
			checkServerVersionCompatibility({
				supportedVersions: { ...MOCK, timestamp: '2023-03-01T00:00:00.000Z' },
				serverVersion: '1.5.0'
			})
		).toBe(false);
	});

	it('should return true if server version is valid', () => {
		expect(
			checkServerVersionCompatibility({
				supportedVersions: MOCK,
				serverVersion: '1.4.0'
			})
		).toBe(true);
	});

	it('should return true if server version is expired and has a valid exception', () => {
		expect(
			checkServerVersionCompatibility({
				supportedVersions: MOCK,
				serverVersion: '1.3.0'
			})
		).toBe(true);
	});

	it('should return false if server version is expired and has an expired exception', () => {
		expect(
			checkServerVersionCompatibility({
				supportedVersions: MOCK,
				serverVersion: '1.2.0'
			})
		).toBe(false);
	});

	it('should return false if server version is expired and has no exception', () => {
		expect(
			checkServerVersionCompatibility({
				supportedVersions: MOCK,
				serverVersion: '1.1.0'
			})
		).toBe(false);
	});

	it('should return false if server version is not supported', () => {
		expect(
			checkServerVersionCompatibility({
				supportedVersions: MOCK,
				serverVersion: '1.0.0'
			})
		).toBe(false);
	});
});
