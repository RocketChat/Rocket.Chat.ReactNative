import { Provider } from 'react-redux';
import { render } from '@testing-library/react-native';

import Content from './Content';
import MessageContext from './Context';
import { setUser } from '../../actions/login';
import { mockedStore } from '../../reducers/mockedStore';
import { type IMessageContent } from './interfaces';

mockedStore.dispatch(
	setUser({
		settings: {
			preferences: {
				convertAsciiEmoji: true
			}
		}
	})
);

const baseProps: Partial<IMessageContent> = {
	_id: 'msg-1',
	isTemp: false,
	isInfo: false,
	isThreadRoom: false,
	isEdited: false,
	isEncrypted: false,
	isIgnored: false,
	isTranslated: false,
	isHeader: false,
	hasError: false,
	getCustomEmoji: jest.fn(),
	navToRoomInfo: jest.fn()
};

const renderContent = (overrides: Partial<IMessageContent> & { attachments?: any[]; autoTranslateLanguage?: string }) =>
	render(
		<Provider store={mockedStore}>
			<MessageContext.Provider
				value={{
					user: { username: 'john' },
					onLinkPress: jest.fn()
				}}>
				<Content {...(baseProps as IMessageContent)} {...(overrides as IMessageContent)} />
			</MessageContext.Provider>
		</Provider>
	);

const tree = (overrides: Partial<IMessageContent> & { attachments?: any[]; autoTranslateLanguage?: string }) => (
	<Provider store={mockedStore}>
		<MessageContext.Provider
			value={{
				user: { username: 'john' },
				onLinkPress: jest.fn()
			}}>
			<Content {...(baseProps as IMessageContent)} {...(overrides as IMessageContent)} />
		</MessageContext.Provider>
	</Provider>
);

describe('Content preview branch — Thread Message Attachment fallback', () => {
	test('renders the Attachment title as a preview line when msg is empty and an image-type Attachment has only a title', () => {
		const { getByText } = renderContent({
			tmid: '1',
			msg: '',
			attachments: [{ image_url: '/file-upload/abc/example.png', title: 'example.png' }]
		});
		expect(getByText('example.png')).toBeTruthy();
	});

	test('renders the Attachment title when msg is empty and a file-type Attachment has only title + title_link', () => {
		const { getByText } = renderContent({
			tmid: '1',
			msg: '',
			attachments: [{ title: 'presentation.pptx', title_link: '/file-upload/abc/presentation.pptx' }]
		});
		expect(getByText('presentation.pptx')).toBeTruthy();
	});

	test('renders the Attachment description (not the title) when description is set on the first Attachment', () => {
		const { getByText, queryByText } = renderContent({
			tmid: '1',
			msg: '',
			attachments: [{ title: 'report.pdf', description: 'Q1 financial report' }]
		});
		expect(getByText('Q1 financial report')).toBeTruthy();
		expect(queryByText('report.pdf')).toBeNull();
	});

	test('renders the translated caption when autoTranslateLanguage matches a translation on the Attachment', () => {
		const { getByText, queryByText } = renderContent({
			tmid: '1',
			msg: '',
			autoTranslateLanguage: 'pt-BR',
			attachments: [
				{
					title: 'photo.png',
					description: 'A nice photo',
					translations: { 'pt-BR': 'Uma bela foto' }
				}
			]
		});
		expect(getByText('Uma bela foto')).toBeTruthy();
		expect(queryByText('A nice photo')).toBeNull();
	});

	test('renders the message body and NOT the file name when msg is non-empty (body wins over Attachment)', () => {
		const { getByText, queryByText } = renderContent({
			tmid: '1',
			msg: 'Here is the file',
			attachments: [{ title: 'secret.pptx' }]
		});
		expect(getByText('Here is the file')).toBeTruthy();
		expect(queryByText('secret.pptx')).toBeNull();
	});

	test('renders "Encrypted message" with no file-name leak when the Thread Message preview is encrypted', () => {
		const { getByTestId, queryByText } = renderContent({
			tmid: '1',
			msg: '',
			isEncrypted: true,
			attachments: [{ title: 'leak.png' }]
		});
		expect(getByTestId('message-encrypted')).toBeTruthy();
		expect(queryByText('leak.png')).toBeNull();
	});

	test('does NOT render an Attachment-derived fallback for non-preview Messages (no tmid)', () => {
		const { queryByText } = renderContent({
			msg: '',
			attachments: [{ title: 'outside-thread.png' }]
		});
		expect(queryByText('outside-thread.png')).toBeNull();
	});

	test('uses only the first Attachment for a multi-Attachment Thread Message preview', () => {
		const { getByText, queryByText } = renderContent({
			tmid: '1',
			msg: '',
			attachments: [{ title: 'first.png' }, { title: 'second.png' }]
		});
		expect(getByText('first.png')).toBeTruthy();
		expect(queryByText('second.png')).toBeNull();
	});

	test('re-renders the preview when an Attachment arrives after mount (no msg change)', () => {
		const { queryByText, rerender } = render(tree({ tmid: '1', msg: '', attachments: [] }));
		expect(queryByText('late.png')).toBeNull();
		rerender(tree({ tmid: '1', msg: '', attachments: [{ title: 'late.png' }] }));
		expect(queryByText('late.png')).toBeTruthy();
	});

	test('re-renders the preview when autoTranslateLanguage changes (no msg change)', () => {
		const attachments = [{ title: 'photo.png', description: 'A nice photo', translations: { 'pt-BR': 'Uma bela foto' } }];
		const { getByText, queryByText, rerender } = render(tree({ tmid: '1', msg: '', attachments }));
		expect(getByText('A nice photo')).toBeTruthy();
		rerender(tree({ tmid: '1', msg: '', attachments, autoTranslateLanguage: 'pt-BR' }));
		expect(getByText('Uma bela foto')).toBeTruthy();
		expect(queryByText('A nice photo')).toBeNull();
	});
});
