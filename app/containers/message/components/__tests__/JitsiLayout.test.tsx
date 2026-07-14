import { Provider } from 'react-redux';
import { render } from '@testing-library/react-native';

import JitsiLayout from '../Layout/JitsiLayout';
import { MessageProvider } from '../../stores/MessageStore';
import { MessageRoomProvider } from '../../stores/MessageRoomStore';
import { useRoomMessageHandlers, type IUseRoomMessageHandlersResult } from '../../hooks/useRoomMessageHandlers';
import { mockedStore } from '../../../../reducers/mockedStore';
import { type TAnyMessageModel } from '../../../../definitions';
import I18n from '../../../../i18n';

jest.mock('../../hooks/useRoomMessageHandlers', () => ({
	useRoomMessageHandlers: jest.fn(() => ({}))
}));

const item = {
	id: 'msg-1',
	msg: '',
	t: 'jitsi_call_started',
	u: { _id: 'author-id', username: 'diego.mello' }
} as unknown as TAnyMessageModel;

const renderJitsiLayout = () => {
	jest.mocked(useRoomMessageHandlers).mockReturnValue({ handleEnterCall: jest.fn() } as unknown as IUseRoomMessageHandlersResult);
	return render(
		<Provider store={mockedStore}>
			<MessageRoomProvider>
				<MessageProvider item={item}>
					<JitsiLayout showTimeLarge={false} />
				</MessageProvider>
			</MessageRoomProvider>
		</Provider>
	);
};

describe('JitsiLayout', () => {
	test('renders the localized "started a call" line AND the join button for a jitsi_call_started message', () => {
		const { getByText } = renderJitsiLayout();
		expect(getByText(I18n.t('Started_call', { userBy: 'diego.mello' }))).toBeTruthy();
		expect(getByText(I18n.t('Click_to_join'))).toBeTruthy();
	});
});
