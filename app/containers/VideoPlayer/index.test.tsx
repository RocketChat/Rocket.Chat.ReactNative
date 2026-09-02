import { render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import VideoPlayer from '.';
import { useAppNavigation } from '../../lib/hooks/navigation';

jest.mock('expo', () => ({
	useEventListener: jest.fn()
}));

jest.mock('../../i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string) => key
	}
}));

jest.mock('../../lib/methods/helpers', () => ({
	formatAttachmentUrl: (url: string) => url,
	encodeAttachmentUrl: (url: string) => url
}));

jest.mock('../../lib/hooks/navigation', () => ({
	useAppNavigation: jest.fn(() => ({
		addListener: jest.fn(() => jest.fn()),
		goBack: jest.fn()
	}))
}));

const mockUseEventListener = require('expo').useEventListener as jest.Mock;

const mockUseAppNavigation = useAppNavigation as jest.Mock;

let statusCallback: ((event: { status: string }) => void) | undefined;

const baseProps = {
	attachment: {
		title_link: 'https://open.rocket.chat/video.mp4',
		video_url: 'https://open.rocket.chat/video.mp4'
	},
	user: { id: 'user-id', token: 'token' },
	baseUrl: 'https://open.rocket.chat'
};

describe('VideoPlayer', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		statusCallback = undefined;
		mockUseAppNavigation.mockReturnValue({
			addListener: jest.fn(() => jest.fn()),
			goBack: jest.fn()
		});
		mockUseEventListener.mockImplementation((_player: unknown, _event: string, cb: (event: { status: string }) => void) => {
			statusCallback = cb;
		});
	});

	it('hides the loading indicator when the video is ready to play', () => {
		const setLoading = jest.fn();
		render(<VideoPlayer {...baseProps} setLoading={setLoading} />);

		statusCallback?.({ status: 'readyToPlay' });

		expect(setLoading).toHaveBeenCalledWith(false);
	});

	it('alerts and navigates back only once when the video fails to load', () => {
		const setLoading = jest.fn();
		const goBack = jest.fn();
		mockUseAppNavigation.mockReturnValue({
			addListener: jest.fn(() => jest.fn()),
			goBack
		});
		const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

		render(<VideoPlayer {...baseProps} setLoading={setLoading} />);

		statusCallback?.({ status: 'error' });
		statusCallback?.({ status: 'error' });

		expect(alertSpy).toHaveBeenCalledTimes(1);
		expect(goBack).toHaveBeenCalledTimes(1);

		alertSpy.mockRestore();
	});
});
