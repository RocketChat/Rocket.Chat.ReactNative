import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import i18n from '../../../i18n';
import { SwitchItem, ISwitch } from './SwitchItem';
import { mockedStore as store } from '../../../reducers/mockedStore';

const onPressMock = jest.fn((value: boolean) => value);

const testSwitch = {
	id: 'switch-id',
	hint: 'Read_only_hint',
	label: 'Chats',
	onValueChange: onPressMock,
	value: false,
	testSwitchID: 'create-channel-switch-id',
	testLabelID: 'create-channel-switch-id-hint'
};

const Render = ({ hint, id, label, onValueChange, value }: ISwitch) => (
	<Provider store={store}>
		<SwitchItem hint={hint} id={id} label={label} onValueChange={onValueChange} value={value} />
	</Provider>
);

describe('SwitchItemEncrypted', () => {
	it('should not render the Encrypted Switch component', async () => {
		const { findByTestId } = render(
			<Render
				hint={testSwitch.hint}
				id={testSwitch.id}
				label={testSwitch.label}
				onValueChange={value => testSwitch.onValueChange(value)}
				value={testSwitch.value}
			/>
		);
		const component = await findByTestId(testSwitch.testSwitchID);
		expect(component).toBeTruthy();
	});
	it('should change value of switch', async () => {
		const { findByTestId } = render(
			<Render
				hint={testSwitch.hint}
				id={testSwitch.id}
				label={testSwitch.label}
				onValueChange={value => testSwitch.onValueChange(value)}
				value={testSwitch.value}
			/>
		);
		const component = await findByTestId(testSwitch.testSwitchID);
		fireEvent(component, 'valueChange', { value: true });
		expect(onPressMock).toHaveReturnedWith({ value: !testSwitch.value });
	});
	it('check if hint exists and is the same from testSwitch object', async () => {
		const { findByTestId } = render(
			<Render
				hint={testSwitch.hint}
				id={testSwitch.id}
				label={testSwitch.label}
				onValueChange={value => testSwitch.onValueChange(value)}
				value={testSwitch.value}
			/>
		);
		const component = await findByTestId(testSwitch.testLabelID);
		expect(component.props.children).toBe(i18n.t(testSwitch.hint));
	});
});
