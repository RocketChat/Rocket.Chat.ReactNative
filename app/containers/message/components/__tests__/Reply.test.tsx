import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import Reply from '../Attachments/Reply';
import { MessageProvider } from '../../stores/MessageStore';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
import { mockedStore } from '../../../../reducers/mockedStore';
import { setUser } from '../../../../actions/login';
import { selectServerSuccess } from '../../../../actions/server';
import { type IAttachment, type TAnyMessageModel } from '../../../../definitions';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../../../lib/constants/keys';
import { fileDownloadAndPreview } from '../../../../lib/methods/helpers';
import openLink from '../../../../lib/methods/helpers/openLink';
import { formatAttachmentUrl } from '../../../../lib/methods/helpers/formatAttachmentUrl';

jest.mock('../../../markdown', () => {
	const React = require('react');
	const { Text } = require('react-native');
	return {
		__esModule: true,
		default: ({ msg }: { msg?: string }) => <Text testID='reply-markdown'>{msg}</Text>,
		MarkdownPreview: ({ msg }: { msg?: string }) => <Text testID='reply-markdown-preview'>{msg}</Text>
	};
});

jest.mock('../../../../lib/methods/helpers', () => ({
	fileDownloadAndPreview: jest.fn(() => Promise.resolve())
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
const mockOpenLink = openLink as jest.Mock;
const mockFormatAttachmentUrl = formatAttachmentUrl as jest.Mock;

const buildItem = (isEncrypted?: boolean) =>
	({
		id: 'msg-1',
		t: isEncrypted ? E2E_MESSAGE_TYPE : undefined,
		e2e: isEncrypted ? E2E_STATUS.PENDING : undefined
	} as unknown as TAnyMessageModel);

const renderReply = ({
	attachment,
	msg,
	isEncrypted,
	ctx = {}
}: {
	attachment?: IAttachment;
	msg?: string;
	isEncrypted?: boolean;
	ctx?: Partial<MessageRoomState>;
}) => {
	const contextValue: Partial<MessageRoomState> = {
		timeFormat: 'HH:mm',
		...ctx
	};
	return render(
		<Provider store={mockedStore}>
			<MessageRoomProvider {...contextValue}>
				<MessageProvider item={buildItem(isEncrypted)}>
					<Reply attachment={attachment as IAttachment} msg={msg} />
				</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);
};

mockedStore.dispatch(setUser({ id: 'user-1', username: 'john', token: 'token' }));
mockedStore.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', version: '', name: '' }));

describe('Reply', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockFormatAttachmentUrl.mockImplementation((url: string) => `formatted:${url}`);
	});

	describe('null gate', () => {
		it('renders nothing when there is no attachment', () => {
			const { toJSON } = renderReply({ attachment: undefined });
			expect(toJSON()).toBeNull();
		});

		it('renders nothing when the message is encrypted', () => {
			const { toJSON } = renderReply({ attachment: { author_name: 'Alice', text: 'Hello' }, isEncrypted: true });
			expect(toJSON()).toBeNull();
		});
	});

	it('renders the reply with an author/text testID', () => {
		const { getByTestId } = renderReply({ attachment: { author_name: 'Alice', text: 'Hello' } });
		expect(getByTestId('reply-Alice-Hello')).toBeTruthy();
	});

	describe('onPress', () => {
		it('does nothing when there is neither a title_link nor an author_link', () => {
			const { getByTestId } = renderReply({ attachment: { author_name: 'Alice', text: 'Hello' } });
			fireEvent.press(getByTestId('reply-Alice-Hello'));
			expect(mockOpenLink).not.toHaveBeenCalled();
			expect(mockFileDownloadAndPreview).not.toHaveBeenCalled();
		});

		it('downloads and previews file attachments that have a title_link', async () => {
			const attachment: IAttachment = { type: 'file', title_link: '/file-upload/doc', text: 'doc', author_name: 'Alice' };
			const { getByTestId } = renderReply({ attachment });
			fireEvent.press(getByTestId('reply-Alice-doc'));

			await waitFor(() => expect(mockFileDownloadAndPreview).toHaveBeenCalled());
			expect(mockFormatAttachmentUrl).toHaveBeenCalledWith('/file-upload/doc', 'user-1', 'token', 'https://open.rocket.chat');
			expect(mockFileDownloadAndPreview).toHaveBeenCalledWith('formatted:/file-upload/doc', attachment, 'msg-1');
			expect(mockOpenLink).not.toHaveBeenCalled();
		});

		it('opens the link for non-file attachments using the title_link', () => {
			const { getByTestId } = renderReply({
				attachment: { title_link: 'https://rocket.chat', text: 'link', author_name: 'Alice' }
			});
			fireEvent.press(getByTestId('reply-Alice-link'));
			expect(mockOpenLink).toHaveBeenCalledWith('https://rocket.chat', 'light');
			expect(mockFileDownloadAndPreview).not.toHaveBeenCalled();
		});

		it('falls back to the author_link when there is no title_link', () => {
			const { getByTestId } = renderReply({
				attachment: { author_link: 'https://author.example', text: 'link', author_name: 'Alice' }
			});
			fireEvent.press(getByTestId('reply-Alice-link'));
			expect(mockOpenLink).toHaveBeenCalledWith('https://author.example', 'light');
		});
	});

	it('disables the touchable when the attachment is a message_link', () => {
		const { getByTestId } = renderReply({
			attachment: { message_link: '/msg', author_name: 'Alice', text: 'Hello' }
		});
		expect(getByTestId('reply-Alice-Hello').props.accessibilityState.disabled).toBe(true);
	});

	describe('Description', () => {
		it('uses MarkdownPreview for file attachments whose title is a filename', () => {
			const { getByTestId } = renderReply({ attachment: { type: 'file', title: 'script.py', author_name: 'Alice' } });
			const preview = getByTestId('reply-markdown-preview');
			expect(preview).toBeTruthy();
			expect(preview.props.children).toBe('script.py');
		});

		it('uses Markdown when the attachment has explicit text', () => {
			const { getByTestId } = renderReply({ attachment: { type: 'file', text: '**bold**', author_name: 'Alice' } });
			expect(getByTestId('reply-markdown').props.children).toBe('**bold**');
		});
	});

	describe('Title', () => {
		it('shows the formatted time only for message_link attachments with a timestamp', () => {
			const { getByText } = renderReply({
				attachment: { message_link: '/msg', ts: '2021-01-01T13:45:00.000Z', author_name: 'Alice', text: 'Hi' }
			});
			expect(getByText('13:45')).toBeTruthy();
		});

		it('does not show a time without a message_link', () => {
			const { queryByText } = renderReply({
				attachment: { ts: '2021-01-01T13:45:00.000Z', author_name: 'Alice', text: 'Hi' }
			});
			expect(queryByText('13:45')).toBeNull();
		});
	});

	describe('UrlImage', () => {
		it('renders the thumbnail image when thumb_url is present', () => {
			const { getByTestId } = renderReply({
				attachment: { thumb_url: 'https://open.rocket.chat/thumb.png', author_name: 'Alice', text: 'Hi' }
			});
			expect(getByTestId('reply-url-image')).toBeTruthy();
		});

		it('does not render an image without thumb_url', () => {
			const { queryByTestId } = renderReply({ attachment: { author_name: 'Alice', text: 'Hi' } });
			expect(queryByTestId('reply-url-image')).toBeNull();
		});
	});

	describe('Fields', () => {
		it('renders attachment fields when present', () => {
			const { getByText } = renderReply({
				attachment: {
					author_name: 'Alice',
					text: 'Hi',
					fields: [{ title: 'Status', value: 'Online', short: true }]
				}
			});
			expect(getByText('Status')).toBeTruthy();
		});
	});
});
