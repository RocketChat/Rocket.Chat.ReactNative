import { fireEvent, render, screen } from '@testing-library/react-native';

import { AttachmentActionSheet } from './AttachmentActionSheet';
import { type IShareAttachment } from '../../../../definitions';
import { generateSnapshots } from '../../../../../.rnstorybook/generateSnapshots';
import * as stories from './AttachmentActionSheet.stories';

jest.mock('react-native-keyboard-controller', () => {
	const { View } = require('react-native');
	return { KeyboardAwareScrollView: View };
});

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

jest.mock('../../../ActionSheet', () => ({
	useActionSheet: jest.fn()
}));

jest.mock('../../../../lib/hooks/useAltTextSupported', () => ({
	useAltTextSupported: jest.fn()
}));

const mockUseActionSheet = require('../../../ActionSheet').useActionSheet as jest.Mock;
const mockUseAltTextSupported = require('../../../../lib/hooks/useAltTextSupported').useAltTextSupported as jest.Mock;

const baseAttachment: IShareAttachment = {
	filename: 'photo.png',
	size: 1024,
	mime: 'image/png',
	path: 'file:///tmp/photo.png'
};

describe('AttachmentActionSheet', () => {
	const hideActionSheet = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		mockUseActionSheet.mockReturnValue({ hideActionSheet });
		mockUseAltTextSupported.mockReturnValue(true);
	});

	it('renders the attachment filename', () => {
		render(<AttachmentActionSheet attachment={baseAttachment} onSave={jest.fn()} />);

		expect(screen.getByText('photo.png')).toBeOnTheScreen();
	});

	it('shows alt text input for image attachments when supported by the server', () => {
		render(<AttachmentActionSheet attachment={baseAttachment} onSave={jest.fn()} />);

		expect(screen.getByLabelText('Alternative text')).toBeOnTheScreen();
	});

	it('hides alt text input when the server does not support it', () => {
		mockUseAltTextSupported.mockReturnValue(false);

		render(<AttachmentActionSheet attachment={baseAttachment} onSave={jest.fn()} />);

		expect(screen.queryByLabelText('Alternative text')).toBeNull();
	});

	it('hides alt text input for non-image attachments', () => {
		render(
			<AttachmentActionSheet attachment={{ ...baseAttachment, filename: 'clip.mp4', mime: 'video/mp4' }} onSave={jest.fn()} />
		);

		expect(screen.queryByLabelText('Alternative text')).toBeNull();
	});

	it('prefills the input with the existing altText', () => {
		render(<AttachmentActionSheet attachment={{ ...baseAttachment, altText: 'A cat on a sofa' }} onSave={jest.fn()} />);

		expect(screen.getByLabelText('Alternative text').props.value).toBe('A cat on a sofa');
	});

	it('calls onSave with the typed altText and hides the action sheet', () => {
		const onSave = jest.fn();
		render(<AttachmentActionSheet attachment={baseAttachment} onSave={onSave} />);

		fireEvent.changeText(screen.getByLabelText('Alternative text'), 'A red apple');
		fireEvent.press(screen.getByText('Save'));

		expect(onSave).toHaveBeenCalledWith({ altText: 'A red apple' });
		expect(hideActionSheet).toHaveBeenCalledTimes(1);
	});

	it('saves an empty altText when the server does not support it', () => {
		mockUseAltTextSupported.mockReturnValue(false);
		const onSave = jest.fn();

		render(<AttachmentActionSheet attachment={baseAttachment} onSave={onSave} />);
		fireEvent.press(screen.getByText('Save'));

		expect(onSave).toHaveBeenCalledWith({ altText: '' });
		expect(hideActionSheet).toHaveBeenCalledTimes(1);
	});
});

generateSnapshots(stories);
