import bugsnag from '@bugsnag/react-native';

import log from '..';
import { UploadHttpError } from '../../fileUpload/UploadHttpError';

jest.mock('@react-native-firebase/crashlytics', () => ({
	getCrashlytics: () => ({ recordError: jest.fn() })
}));

describe('log', () => {
	const reportedGroupingHash = (error: Error) => {
		const event = { addMetadata: jest.fn(), groupingHash: undefined as string | undefined };
		jest.spyOn(bugsnag, 'notify').mockImplementation((_error, onError) => {
			onError?.(event as never, () => {});
		});
		log(error);
		return event.groupingHash;
	};

	beforeEach(() => {
		Object.assign(global, { __DEV__: false });
	});

	afterEach(() => {
		Object.assign(global, { __DEV__: true });
		jest.restoreAllMocks();
	});

	it('groups upload failures by status', () => {
		expect(reportedGroupingHash(new UploadHttpError(413))).toBe(reportedGroupingHash(new UploadHttpError(413)));
		expect(reportedGroupingHash(new UploadHttpError(413))).not.toBe(reportedGroupingHash(new UploadHttpError(500)));
	});

	it('leaves other errors to the default grouping', () => {
		expect(reportedGroupingHash(new Error('boom'))).toBeUndefined();
	});
});
