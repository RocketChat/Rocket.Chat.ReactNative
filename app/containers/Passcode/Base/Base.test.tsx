import React, { createRef } from 'react';
import { render } from '@testing-library/react-native';

import { generateSnapshots } from '../../../../.rnstorybook/generateSnapshots';
import Base, { type IBase } from '.';
import { TYPE } from '../constants';
import * as stories from './Base.stories';

const onEndProcessMock = jest.fn();

const TestBase = ({ ...props }) => {
	const ref = createRef<IBase>();
	return <Base ref={ref} type={TYPE.ENTER} title='Test Title' onEndProcess={onEndProcessMock} {...props} />;
};

describe('Base Passcode Component', () => {
	beforeEach(() => {
		onEndProcessMock.mockClear();
	});

	test('should render with title', () => {
		const { getByText } = render(<TestBase title='Enter Passcode' />);
		expect(getByText('Enter Passcode')).toBeTruthy();
	});

	test('should render with subtitle when provided', () => {
		const { getByText } = render(<TestBase title='Enter Passcode' subtitle='Authentication required' />);
		expect(getByText('Authentication required')).toBeTruthy();
	});

	test('should not render subtitle when not provided', () => {
		const { queryByText } = render(<TestBase title='Enter Passcode' />);
		expect(queryByText('Authentication required')).toBeNull();
	});

	test('should expose ref methods', () => {
		const ref = createRef<IBase>();
		render(<Base ref={ref} type={TYPE.ENTER} title='Enter Passcode' onEndProcess={onEndProcessMock} />);
		expect(ref.current?.clearPasscode).toBeDefined();
		expect(ref.current?.wrongPasscode).toBeDefined();
		expect(ref.current?.animate).toBeDefined();
	});

	test('should render biometry button when showBiometry is true', () => {
		const { getByTestId } = render(
			<TestBase type={TYPE.ENTER} title='Enter Passcode' showBiometry onBiometryPress={() => {}} />
		);
		expect(getByTestId('biometry-button')).toBeTruthy();
	});

	test('should render all passcode buttons with testIDs', () => {
		const { getByTestId } = render(<TestBase type={TYPE.ENTER} title='Enter Passcode' />);
		// Number buttons 1-9
		for (let i = 1; i <= 9; i++) {
			expect(getByTestId(`passcode-button-${i}`)).toBeTruthy();
		}
		// Button 0 and backspace
		expect(getByTestId('passcode-button-0')).toBeTruthy();
		expect(getByTestId('passcode-button-backspace')).toBeTruthy();
	});
});

generateSnapshots(stories);
