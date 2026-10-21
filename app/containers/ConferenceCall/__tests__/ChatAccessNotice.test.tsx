import { fireEvent, render } from '@testing-library/react-native';

import ChatAccessNotice from '../ChatAccessNotice';

const renderNotice = (count = 2) => {
	const onReview = jest.fn();
	const utils = render(<ChatAccessNotice count={count} onReview={onReview} />);
	return { ...utils, onReview };
};

describe('ChatAccessNotice', () => {
	it('says how many people in the call cannot see the chat', () => {
		const { getByText } = renderNotice(3);

		expect(getByText("3 in this call can't see the chat")).toBeTruthy();
	});

	it('opens the review from the Review button', () => {
		const { getByTestId, onReview } = renderNotice();

		fireEvent.press(getByTestId('conference-chat-access-review'));

		expect(onReview).toHaveBeenCalledTimes(1);
	});

	it('goes away from the dismiss button, without opening the review', () => {
		const { getByLabelText, queryByTestId, onReview } = renderNotice();

		fireEvent.press(getByLabelText('Dismiss'));

		expect(queryByTestId('conference-chat-access-banner')).toBeNull();
		expect(onReview).not.toHaveBeenCalled();
	});

	it('stays dismissed when more people turn up who cannot see the chat', () => {
		const { getByLabelText, queryByTestId, rerender } = renderNotice(1);
		fireEvent.press(getByLabelText('Dismiss'));

		rerender(<ChatAccessNotice count={4} onReview={jest.fn()} />);

		expect(queryByTestId('conference-chat-access-banner')).toBeNull();
	});

	it('shows nothing when everyone can see the chat', () => {
		const { queryByTestId } = renderNotice(0);

		expect(queryByTestId('conference-chat-access-banner')).toBeNull();
	});
});
