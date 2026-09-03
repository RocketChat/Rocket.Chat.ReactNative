import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import Attachments from '../Attachments/Attachments';
import { MessageProvider } from '../../stores/MessageStore';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
import { mockedStore } from '../../../../reducers/mockedStore';
import { type IAttachment, type TAnyMessageModel } from '../../../../definitions';
import { fileDownloadAndPreview } from '../../../../lib/methods/helpers/fileDownload';

jest.mock('../../../markdown', () => {
	const React = require('react');
	const { Text } = require('react-native');
	return {
		__esModule: true,
		default: ({ msg }: { msg?: string }) => <Text testID='reply-markdown'>{msg}</Text>,
		MarkdownPreview: ({ msg }: { msg?: string }) => <Text testID='reply-markdown-preview'>{msg}</Text>
	};
});

// Never resolves, so a click leaves the reply's loading state stuck at `true`.
jest.mock('../../../../lib/methods/helpers/fileDownload', () => ({
	fileDownloadAndPreview: jest.fn(() => new Promise(() => {}))
}));

jest.mock('../../../../lib/methods/helpers/openLink', () => ({
	__esModule: true,
	default: jest.fn()
}));

jest.mock('../../../../lib/methods/helpers/formatAttachmentUrl', () => ({
	formatAttachmentUrl: jest.fn((url: string) => `formatted:${url}`)
}));

jest.mock('expo-image', () => {
	const { View } = require('react-native');
	const Image = () => <View testID='reply-url-image' />;
	Image.loadAsync = jest.fn();
	return { Image };
});

const mockFileDownloadAndPreview = fileDownloadAndPreview as jest.Mock;

const buildItem = () => ({ id: 'msg-1' }) as unknown as TAnyMessageModel;

const renderQuote = (attachments: IAttachment[], ctx: Partial<MessageRoomState> = {}) => {
	const contextValue: Partial<MessageRoomState> = {
		timeFormat: 'HH:mm',
		...ctx
	};
	return render(
		<Provider store={mockedStore}>
			<MessageRoomProvider {...contextValue}>
				<MessageProvider item={buildItem()}>
					<Attachments variant='quote' attachments={attachments} />
				</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);
};

describe('Quote', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('keeps per-attachment loading state pinned to its own reply when the quotes are reordered', async () => {
		const attachmentA: IAttachment = { type: 'file', title_link: 'file-a', text: 'A', author_name: 'Author' };
		const attachmentB: IAttachment = { type: 'file', title_link: 'file-b', text: 'B', author_name: 'Author' };

		const { getByTestId, rerender } = renderQuote([attachmentA, attachmentB]);

		fireEvent.press(getByTestId('reply-Author-A'));
		await waitFor(() => expect(mockFileDownloadAndPreview).toHaveBeenCalled());
		expect(getByTestId('reply-Author-A').props.accessibilityState.disabled).toBe(true);
		expect(getByTestId('reply-Author-B').props.accessibilityState.disabled).toBe(false);

		rerender(
			<Provider store={mockedStore}>
				<MessageRoomProvider timeFormat='HH:mm'>
					<MessageProvider item={buildItem()}>
						<Attachments variant='quote' attachments={[attachmentB, attachmentA]} />
					</MessageProvider>
				</MessageRoomProvider>
			</Provider>
		);

		// Reordering must not transfer attachment A's stuck loading state onto attachment B.
		expect(getByTestId('reply-Author-B').props.accessibilityState.disabled).toBe(false);
		expect(getByTestId('reply-Author-A').props.accessibilityState.disabled).toBe(true);
	});
});
