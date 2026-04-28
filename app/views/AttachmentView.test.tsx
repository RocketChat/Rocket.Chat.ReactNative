import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import AttachmentView from './AttachmentView';

const mockShowActionSheet = jest.fn();
const mockNavigation = {
	addListener: jest.fn(() => jest.fn()),
	setOptions: jest.fn(),
	pop: jest.fn()
};
const mockUseAltTextSupported = jest.fn();

jest.mock('@react-navigation/elements', () => ({
	useHeaderHeight: () => 0
}));

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

jest.mock('expo-av', () => ({
	ResizeMode: { CONTAIN: 'contain' },
	Video: () => null
}));

jest.mock('expo-file-system/legacy', () => ({
	deleteAsync: jest.fn()
}));

jest.mock('@react-native-camera-roll/camera-roll', () => ({
	CameraRoll: {
		save: jest.fn()
	}
}));

jest.mock('../containers/ActionSheet', () => ({
	useActionSheet: () => ({
		showActionSheet: mockShowActionSheet
	})
}));

jest.mock('../containers/ActivityIndicator', () => () => null);

jest.mock('../containers/ImageViewer', () => ({
	ImageViewer: () => {
		const { Text } = require('react-native');
		return <Text>Image Viewer</Text>;
	}
}));

jest.mock('../theme', () => ({
	useTheme: () => ({
		colors: {
			surfaceRoom: 'white',
			surfaceNeutral: '#ddd',
			fontDefault: '#111',
			fontTitlesLabels: '#222'
		}
	})
}));

jest.mock('../lib/hooks/useAltTextSupported', () => ({
	useAltTextSupported: () => mockUseAltTextSupported()
}));

jest.mock('../lib/hooks/navigation', () => ({
	useAppNavigation: () => mockNavigation,
	useAppRoute: () => ({
		params: {
			attachment: {
				title: 'IMG_2444.jpg',
				image_url: 'https://open.rocket.chat/image.png',
				description: 'A wavy orange and black pattern'
			}
		}
	})
}));

jest.mock('../lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: any) => unknown) =>
		selector({
			server: {
				server: 'https://open.rocket.chat'
			},
			login: {
				user: {
					id: 'user-id',
					token: 'token'
				}
			},
			settings: {
				Allow_Save_Media_to_Gallery: true
			}
		})
}));

jest.mock('../lib/methods/helpers', () => ({
	formatAttachmentUrl: (url: string) => url,
	isAndroid: false,
	fileDownload: jest.fn(),
	showErrorAlert: jest.fn()
}));

describe('AttachmentView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders the alt text label and opens the action sheet when pressed', () => {
		mockUseAltTextSupported.mockReturnValue(true);

		const { getByTestId } = render(<AttachmentView />);

		fireEvent.press(getByTestId('attachment-view-alt-text-label'));

		expect(mockShowActionSheet).toHaveBeenCalledTimes(1);
		expect(mockShowActionSheet.mock.calls[0][0].children.props.altText).toBe('A wavy orange and black pattern');
	});

	it('does not render the alt text label when alt text is not supported', () => {
		mockUseAltTextSupported.mockReturnValue(false);

		const { queryByTestId } = render(<AttachmentView />);

		expect(queryByTestId('attachment-view-alt-text-label')).toBeNull();
	});
});
