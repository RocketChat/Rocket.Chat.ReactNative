import { act, renderHook } from '@testing-library/react-native';

import SSLPinning from '~/lib/methods/helpers/sslPinning';
import { showToast } from '~/lib/methods/helpers/showToast';
import useCertificate from '../useCertificate';

jest.mock('~/lib/methods/helpers/sslPinning', () => ({
	__esModule: true,
	default: { pickCertificate: jest.fn(), setCertificate: jest.fn(), removeCertificate: jest.fn() },
	getServerCertificate: jest.fn()
}));
jest.mock('~/lib/methods/helpers/showToast', () => ({ showToast: jest.fn() }));
jest.mock('~/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

const mockPickCertificate = SSLPinning?.pickCertificate as jest.Mock;

describe('useCertificate', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('stores the selected certificate', async () => {
		mockPickCertificate.mockResolvedValueOnce('certificate.p12');
		const { result } = renderHook(() => useCertificate());

		await act(async () => {
			await result.current.chooseCertificate('https://open.rocket.chat');
		});

		expect(result.current.certificate).toBe('certificate.p12');
		expect(showToast).not.toHaveBeenCalled();
	});

	it('shows feedback when the picker returns no certificate', async () => {
		mockPickCertificate.mockResolvedValueOnce(null);
		const { result } = renderHook(() => useCertificate());

		await act(async () => {
			await result.current.chooseCertificate('https://open.rocket.chat');
		});

		expect(showToast).toHaveBeenCalledWith('No_certificate_selected');
		expect(result.current.certificate).toBeNull();
	});

	it('stays silent when the platform picker rejects (user cancelled)', async () => {
		mockPickCertificate.mockRejectedValueOnce(new Error('cancelled'));
		const { result } = renderHook(() => useCertificate());

		await act(async () => {
			await result.current.chooseCertificate('https://open.rocket.chat');
		});

		expect(showToast).not.toHaveBeenCalled();
		expect(result.current.certificate).toBeNull();
	});
});
