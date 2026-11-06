import { type IShareAttachment } from '~/definitions';
import { hasOnlySkippedAttachments } from '../hasOnlySkippedAttachments';

const attachment = (canUpload: boolean) => ({ path: `file:///tmp/${canUpload}.png`, canUpload }) as IShareAttachment;

describe('hasOnlySkippedAttachments', () => {
	it('is false for an empty tray', () => {
		expect(hasOnlySkippedAttachments([])).toBe(false);
	});

	it('is true when no attachment can be uploaded', () => {
		expect(hasOnlySkippedAttachments([attachment(false), attachment(false)])).toBe(true);
	});

	it('is false when at least one attachment can be uploaded', () => {
		expect(hasOnlySkippedAttachments([attachment(false), attachment(true)])).toBe(false);
	});
});
