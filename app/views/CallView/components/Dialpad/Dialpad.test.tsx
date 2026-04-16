import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import Dialpad from './Dialpad';
import { useCallStore } from '../../../../lib/services/voip/useCallStore';
import { mockedStore } from '../../../../reducers/mockedStore';
import * as stories from './Dialpad.stories';
import { generateSnapshots } from '../../../../../.rnstorybook/generateSnapshots';
import { useCallLayoutMode } from '../../useCallLayoutMode';
import {
	BASE_ROW_HEIGHT,
	BASE_ROW_HEIGHT_CONDENSED,
	useResponsiveLayout
} from '../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

jest.mock('../../useCallLayoutMode', () => ({
	useCallLayoutMode: jest.fn(() => ({ layoutMode: 'narrow' }))
}));

jest.mock('../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout', () => {
	const actual = jest.requireActual('../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout');
	return {
		...actual,
		// Delegate to real hook so Storybook snapshots keep ResponsiveLayoutContext.Provider working.
		useResponsiveLayout: jest.fn(() => actual.useResponsiveLayout())
	};
});

jest.mock('../../../../containers/ActionSheet', () => ({
	hideActionSheetRef: jest.fn()
}));

jest.mock('react-native-incall-manager', () => ({
	start: jest.fn(),
	stop: jest.fn(),
	setForceSpeakerphoneOn: jest.fn(() => Promise.resolve())
}));

const sendDTMFMock = jest.fn();

// Helper to set store state for tests
const setStoreState = (overrides: Partial<ReturnType<typeof useCallStore.getState>> = {}) => {
	const mockCall = {
		state: 'active',
		muted: false,
		held: false,
		contact: {},
		sendDTMF: sendDTMFMock,
		emitter: { on: jest.fn(), off: jest.fn() }
	} as any;

	useCallStore.setState({
		call: mockCall,
		callId: 'test-id',
		callState: 'active',
		dialpadValue: '',
		...overrides
	});
};

const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const mockResponsiveLayout = (width: number, height: number) =>
	(useResponsiveLayout as jest.Mock).mockReturnValue({
		width,
		height,
		fontScale: 1,
		fontScaleLimited: 1,
		isLargeFontScale: false,
		rowHeight: BASE_ROW_HEIGHT,
		rowHeightCondensed: BASE_ROW_HEIGHT_CONDENSED
	});

describe('Dialpad', () => {
	beforeEach(() => {
		(useCallLayoutMode as jest.Mock).mockReturnValue({ layoutMode: 'narrow' });
		const actual = jest.requireActual('../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout');
		(useResponsiveLayout as jest.Mock).mockImplementation(() => actual.useResponsiveLayout());
		useCallStore.getState().reset();
		sendDTMFMock.mockClear();
	});

	it('should render correctly', () => {
		setStoreState();
		const { getByTestId } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);
		expect(getByTestId('dialpad-input')).toBeTruthy();
	});

	it('should display the input field', () => {
		setStoreState();
		const { getByTestId } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);
		expect(getByTestId('dialpad-input')).toBeTruthy();
	});

	it('should display dialpad buttons', () => {
		setStoreState();
		const { getByText } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);
		expect(getByText('1')).toBeTruthy();
		expect(getByText('2')).toBeTruthy();
		expect(getByText('0')).toBeTruthy();
		expect(getByText('*')).toBeTruthy();
		expect(getByText('#')).toBeTruthy();
	});

	it('should call sendDTMF and update value when digit is pressed', () => {
		setStoreState();
		const { getByText } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);

		fireEvent.press(getByText('5'));
		expect(sendDTMFMock).toHaveBeenCalledWith('5');
		expect(sendDTMFMock).toHaveBeenCalledTimes(1);

		fireEvent.press(getByText('2'));
		expect(sendDTMFMock).toHaveBeenCalledWith('2');
		expect(sendDTMFMock).toHaveBeenCalledTimes(2);
	});

	it('should display letters on keys that have them', () => {
		setStoreState();
		const { getByText } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);
		expect(getByText('ABC')).toBeTruthy();
		expect(getByText('DEF')).toBeTruthy();
		expect(getByText('WXYZ')).toBeTruthy();
	});

	it('should render with custom testID', () => {
		setStoreState();
		const { getByTestId } = render(
			<Wrapper>
				<Dialpad testID='custom-dialpad' />
			</Wrapper>
		);
		expect(getByTestId('custom-dialpad-input')).toBeTruthy();
	});

	it('should render split layout only for narrow phone landscape', () => {
		(useCallLayoutMode as jest.Mock).mockReturnValue({ layoutMode: 'narrow' });
		mockResponsiveLayout(600, 400);
		setStoreState();
		const { getByTestId } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);
		expect(getByTestId('dialpad-landscape-container')).toBeTruthy();
	});

	it('should not use split layout for wide layout in portrait', () => {
		(useCallLayoutMode as jest.Mock).mockReturnValue({ layoutMode: 'wide' });
		mockResponsiveLayout(800, 1000);
		setStoreState();
		const { getByTestId, queryByTestId } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);
		expect(getByTestId('dialpad-input')).toBeTruthy();
		expect(queryByTestId('dialpad-landscape-container')).toBeNull();
	});

	it('should not use split layout for wide layout in landscape', () => {
		(useCallLayoutMode as jest.Mock).mockReturnValue({ layoutMode: 'wide' });
		mockResponsiveLayout(1000, 600);
		setStoreState();
		const { getByTestId, queryByTestId } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);
		expect(getByTestId('dialpad-input')).toBeTruthy();
		expect(queryByTestId('dialpad-landscape-container')).toBeNull();
	});

	it('should render in portrait layout when layoutMode is narrow and portrait', () => {
		(useCallLayoutMode as jest.Mock).mockReturnValue({ layoutMode: 'narrow' });
		mockResponsiveLayout(375, 812);
		setStoreState();
		const { getByTestId, queryByTestId } = render(
			<Wrapper>
				<Dialpad testID='dialpad' />
			</Wrapper>
		);
		expect(getByTestId('dialpad-input')).toBeTruthy();
		expect(queryByTestId('dialpad-landscape-container')).toBeNull();
	});
});

generateSnapshots(stories);
