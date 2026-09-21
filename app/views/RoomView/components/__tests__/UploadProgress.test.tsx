import { render, screen, waitFor } from '@testing-library/react-native';
import { BehaviorSubject } from 'rxjs';

import UploadProgress from '../UploadProgress';
import { isUploadActive } from '~/lib/methods/sendFileMessage/utils';

const mockUploads = new BehaviorSubject<any[]>([]);

jest.mock('@nozbe/watermelondb', () => ({ Q: { where: jest.fn() } }));
jest.mock('~/lib/database', () => ({
	__esModule: true,
	default: {
		active: {
			get: () => ({ query: () => ({ observeWithColumns: () => mockUploads }) }),
			write: (cb: () => Promise<unknown>) => cb()
		}
	}
}));
jest.mock('~/i18n', () => ({ __esModule: true, default: { t: (key: string) => key, isTranslated: () => false } }));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('~/lib/methods/sendFileMessage', () => ({ sendFileMessage: jest.fn() }));
jest.mock('~/lib/methods/sendFileMessage/utils', () => ({
	cancelUpload: jest.fn(),
	isUploadActive: jest.fn(() => true)
}));

const upload = (overrides: Record<string, unknown>) => {
	const record: any = {
		path: '/tmp/pic.jpg',
		name: 'pic.jpg',
		progress: 0,
		error: false,
		update: jest.fn(async (cb: (u: any) => void) => cb(record)),
		destroyPermanently: jest.fn(),
		...overrides
	};
	return record;
};

const show = (records: any[]) => {
	mockUploads.next(records);
	render(<UploadProgress rid='GENERAL' width={360} baseUrl='https://open.rocket.chat' user={{ id: 'u1', token: 't1' } as any} />);
};

beforeEach(() => {
	jest.clearAllMocks();
	(isUploadActive as jest.Mock).mockReturnValue(true);
});

describe('UploadProgress', () => {
	it('explains a 413 and does not offer a retry that cannot work', () => {
		show([upload({ error: true, errorStatus: 413 })]);

		expect(screen.getByText('error-file-too-large')).toBeOnTheScreen();
		expect(screen.queryByText('Try_again')).toBeNull();
	});

	it('offers a retry for a failure that may succeed later', () => {
		show([upload({ error: true, errorStatus: 503 })]);

		expect(screen.getByText('Try_again')).toBeOnTheScreen();
	});

	it('shows the server message alongside a retry for an unmapped status', () => {
		show([upload({ error: true, errorStatus: 507, errorMessage: 'Storage quota exceeded' })]);

		expect(screen.getByText('Storage quota exceeded')).toBeOnTheScreen();
		expect(screen.getByText('Try_again')).toBeOnTheScreen();
	});

	it('falls back to a plain retry when nothing is known about the failure', () => {
		show([upload({ error: true })]);

		expect(screen.getByText('Try_again')).toBeOnTheScreen();
	});

	it('keeps a reason persisted by an earlier session when the queue is empty', async () => {
		(isUploadActive as jest.Mock).mockReturnValue(false);
		const record = upload({ error: true, errorStatus: 413, errorMessage: 'File is too large' });

		show([record]);

		await waitFor(() => expect(record.update).toHaveBeenCalled());
		expect(record.error).toBe(true);
		expect(record.errorStatus).toBe(413);
		expect(record.errorMessage).toBe('File is too large');
	});

	it('marks an upload left behind by a killed app as failed', async () => {
		(isUploadActive as jest.Mock).mockReturnValue(false);
		const record = upload({ error: false, progress: 42 });

		show([record]);

		await waitFor(() => expect(record.error).toBe(true));
		expect(record.errorStatus).toBeUndefined();
	});

	it('shows progress instead of an error while uploading', () => {
		show([upload({ error: false, progress: 42 })]);

		expect(screen.getByText(/Uploading/)).toBeOnTheScreen();
		expect(screen.queryByText('Try_again')).toBeNull();
	});

	describe('accessibility', () => {
		it('exposes the retry and cancel controls as separate buttons', () => {
			show([upload({ error: true, errorStatus: 503 })]);

			expect(screen.getByRole('button', { name: 'Try_again' })).toBeOnTheScreen();
			expect(screen.getByRole('button', { name: 'Cancel_upload' })).toBeOnTheScreen();
		});

		it('reads the failure and its reason as one announcement', () => {
			show([upload({ error: true, errorStatus: 507, errorMessage: 'Storage quota exceeded' })]);

			expect(screen.getByLabelText('Error_uploading pic.jpg. Storage quota exceeded')).toBeOnTheScreen();
		});

		it('leaves cancel reachable when there is no retry to offer', () => {
			show([upload({ error: true, errorStatus: 413 })]);

			expect(screen.queryByRole('button', { name: 'Try_again' })).toBeNull();
			expect(screen.getByRole('button', { name: 'Cancel_upload' })).toBeOnTheScreen();
		});
	});
});
