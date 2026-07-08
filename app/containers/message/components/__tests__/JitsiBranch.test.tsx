import { Provider } from 'react-redux';
import { render } from '@testing-library/react-native';

import JitsiBranch from '../Message/JitsiBranch';
import { MessageProvider } from '../../stores/MessageStore';
import { MessageRoomProvider, type MessageRoomState } from '../../stores/MessageRoomStore';
import { mockedStore } from '../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../definitions';
import I18n from '../../../../i18n';

const item = {
	id: 'msg-1',
	msg: '',
	t: 'jitsi_call_started',
	u: { _id: 'author-id', username: 'diego.mello' }
} as unknown as TAnyMessageModel;

const renderJitsiBranch = () => {
	const room: Partial<MessageRoomState> = { handleEnterCall: jest.fn() };
	return render(
		<Provider store={mockedStore}>
			<MessageRoomProvider {...room}>
				<MessageProvider item={item}>
					<JitsiBranch showTimeLarge={false} />
				</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);
};

describe('JitsiBranch', () => {
	test('renders the localized "started a call" line AND the join button for a jitsi_call_started message', () => {
		const { getByText } = renderJitsiBranch();
		expect(getByText(I18n.t('Started_call', { userBy: 'diego.mello' }))).toBeTruthy();
		expect(getByText(I18n.t('Click_to_join'))).toBeTruthy();
	});
});
