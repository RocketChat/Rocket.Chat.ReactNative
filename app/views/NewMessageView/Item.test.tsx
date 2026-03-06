import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import Item from './Item';
import { mockedStore } from '../../reducers/mockedStore';
import { setUser } from '../../actions/login';
import * as stories from './Item.stories';
import { generateSnapshots } from '../../../.rnstorybook/generateSnapshots';
import { NewMediaCall } from '../../containers/NewMediaCall';

const mockShowActionSheetRef = jest.fn();
const mockSetSelectedPeer = jest.fn();

jest.mock('../../containers/ActionSheet', () => ({
	showActionSheetRef: (params: unknown) => mockShowActionSheetRef(params)
}));

jest.mock('../../lib/services/voip/usePeerAutocompleteStore', () => ({
	usePeerAutocompleteStore: {
		getState: () => ({
			setSelectedPeer: mockSetSelectedPeer
		})
	}
}));

const mockUseMediaCallPermission = jest.fn(() => true);

jest.mock('../../lib/hooks/useMediaCallPermission', () => ({
	useMediaCallPermission: () => mockUseMediaCallPermission()
}));

jest.mock('../../containers/NewMediaCall', () => ({
	NewMediaCall: jest.fn(() => null)
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

describe('NewMessageView Item', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedStore.dispatch(setUser({ id: 'abc', username: 'rocket.cat', name: 'Rocket Cat' }));
		mockUseMediaCallPermission.mockReturnValue(true);
	});

	it('should render correctly', () => {
		const { getByTestId } = render(
			<Wrapper>
				<Item userId='user123' name='John Doe' username='john.doe' onPress={() => {}} testID='new-message-view-item-john.doe' />
			</Wrapper>
		);
		expect(getByTestId('new-message-view-item-john.doe')).toBeTruthy();
	});

	it('should display the name', () => {
		const { getByText } = render(
			<Wrapper>
				<Item userId='user123' name='John Doe' username='john.doe' onPress={() => {}} testID='new-message-view-item-john.doe' />
			</Wrapper>
		);
		expect(getByText('John Doe')).toBeTruthy();
	});

	it('should call onPress when main item is pressed', () => {
		const onPressMock = jest.fn();
		const { getByTestId } = render(
			<Wrapper>
				<Item
					userId='user123'
					name='John Doe'
					username='john.doe'
					onPress={onPressMock}
					testID='new-message-view-item-john.doe'
				/>
			</Wrapper>
		);
		fireEvent.press(getByTestId('new-message-view-item-john.doe'));
		expect(onPressMock).toHaveBeenCalledTimes(1);
	});

	it('should call onLongPress when main item is long pressed', () => {
		const onLongPressMock = jest.fn();
		const { getByTestId } = render(
			<Wrapper>
				<Item
					userId='user123'
					name='John Doe'
					username='john.doe'
					onPress={() => {}}
					onLongPress={onLongPressMock}
					testID='new-message-view-item-john.doe'
				/>
			</Wrapper>
		);
		fireEvent(getByTestId('new-message-view-item-john.doe'), 'longPress');
		expect(onLongPressMock).toHaveBeenCalledTimes(1);
	});

	it('should render call button and open new media call flow when hasMediaCallPermission is true', () => {
		mockUseMediaCallPermission.mockReturnValue(true);
		const { getByTestId } = render(
			<Wrapper>
				<Item userId='user123' name='John Doe' username='john.doe' onPress={() => {}} testID='new-message-view-item-john.doe' />
			</Wrapper>
		);
		fireEvent.press(getByTestId('new-message-view-item-john.doe-call'));
		expect(mockSetSelectedPeer).toHaveBeenCalledTimes(1);
		expect(mockSetSelectedPeer).toHaveBeenCalledWith({
			type: 'user',
			value: 'user123',
			username: 'john.doe',
			label: 'John Doe'
		});
		expect(mockShowActionSheetRef).toHaveBeenCalledTimes(1);
		const [actionSheetArgs] = mockShowActionSheetRef.mock.calls[0];
		expect(React.isValidElement(actionSheetArgs.children)).toBe(true);
		expect(actionSheetArgs.children.type).toBe(NewMediaCall);
	});

	it('should not render call button when hasMediaCallPermission is false', () => {
		mockUseMediaCallPermission.mockReturnValue(false);
		const { queryByTestId } = render(
			<Wrapper>
				<Item userId='user123' name='John Doe' username='john.doe' onPress={() => {}} testID='new-message-view-item-john.doe' />
			</Wrapper>
		);
		expect(queryByTestId('new-message-view-item-john.doe-call')).toBeNull();
	});

	it('should not open call flow when userId is falsy and call button is pressed', () => {
		mockUseMediaCallPermission.mockReturnValue(true);
		const { getByTestId } = render(
			<Wrapper>
				<Item userId={''} name='John Doe' username='john.doe' onPress={() => {}} testID='new-message-view-item-john.doe' />
			</Wrapper>
		);
		fireEvent.press(getByTestId('new-message-view-item-john.doe-call'));
		expect(mockSetSelectedPeer).not.toHaveBeenCalled();
		expect(mockShowActionSheetRef).not.toHaveBeenCalled();
	});

	it('should have correct accessibility label', () => {
		const { getByLabelText } = render(
			<Wrapper>
				<Item userId='user123' name='John Doe' username='john.doe' onPress={() => {}} testID='new-message-view-item-john.doe' />
			</Wrapper>
		);
		expect(getByLabelText('John Doe')).toBeTruthy();
	});

	it('should match snapshot when hasMediaCallPermission is false', () => {
		mockUseMediaCallPermission.mockReturnValue(false);
		const { toJSON } = render(
			<Wrapper>
				<Item userId='user123' name='John Doe' username='john.doe' onPress={() => {}} testID='new-message-view-item-john.doe' />
			</Wrapper>
		);
		expect(toJSON()).toMatchSnapshot();
	});
});

generateSnapshots(stories);
