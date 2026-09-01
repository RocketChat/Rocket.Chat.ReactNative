import { render } from '@testing-library/react-native';

import Encrypted from '../RightIcons/Encrypted';
import { MessageProviders } from '../../__tests__/testHelpers';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../../../lib/constants/keys';
import { type TAnyMessageModel } from '../../../../definitions';

const encryptedItem = {
	id: 'msg1',
	t: E2E_MESSAGE_TYPE,
	e2e: E2E_STATUS.PENDING
} as unknown as TAnyMessageModel;

describe('Encrypted', () => {
	test('renders the affordance when an encrypted-press handler was supplied', () => {
		const { getByTestId } = render(
			<MessageProviders item={encryptedItem} room={{ handlers: { onEncryptedPress: jest.fn() } }}>
				<Encrypted />
			</MessageProviders>
		);

		expect(getByTestId('message-encrypted')).toBeTruthy();
	});

	test('renders nothing when no encrypted-press handler was supplied', () => {
		const { queryByTestId } = render(
			<MessageProviders item={encryptedItem} room={{ handlers: {} }}>
				<Encrypted />
			</MessageProviders>
		);

		expect(queryByTestId('message-encrypted')).toBeNull();
	});
});
