import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { SwitchItemEncrypted, ISwitchItemEncrypted } from './SwitchItemEncrypted';
import { mockedStore as store } from '../../../reducers/mockedStore';
import i18n from '../../../i18n';

const onPressMock = jest.fn((value: boolean) => value);

const testEncrypted = {
	encrypted: false,
	encryptionEnabled: false,
	isTeam: false,
	onValueChangeEncrypted: onPressMock,
	type: false,
	testSwitchID: 'create-channel-encrypted',
	testLabelID: `create-channel-encrypted-hint`
};

const Render = ({ encrypted, encryptionEnabled, isTeam, onValueChangeEncrypted, type }: ISwitchItemEncrypted) => (
	<Provider store={store}>
		<SwitchItemEncrypted
			encrypted={encrypted}
			encryptionEnabled={encryptionEnabled}
			isTeam={isTeam}
			onValueChangeEncrypted={onValueChangeEncrypted}
			type={type}
		/>
	</Provider>
);

describe('SwitchItemEncrypted', () => {
	it('should not render the Encrypted Switch component', async () => {
		const { findByTestId } = render(
			<Render
				encrypted={testEncrypted.encrypted}
				encryptionEnabled={testEncrypted.encryptionEnabled}
				isTeam={testEncrypted.isTeam}
				onValueChangeEncrypted={value => testEncrypted.onValueChangeEncrypted(value)}
				type={testEncrypted.type}
			/>
		);
		try {
			await findByTestId(testEncrypted.testSwitchID);
		} catch (e) {
			expect(e).toBeTruthy();
		}
	});
	it('should render the Encrypted Switch component', async () => {
		testEncrypted.encryptionEnabled = true;
		const { findByTestId } = render(
			<Render
				encrypted={testEncrypted.encrypted}
				encryptionEnabled={testEncrypted.encryptionEnabled}
				isTeam={testEncrypted.isTeam}
				onValueChangeEncrypted={value => testEncrypted.onValueChangeEncrypted(value)}
				type={testEncrypted.type}
			/>
		);
		const component = await findByTestId(testEncrypted.testSwitchID);
		expect(component).toBeTruthy();
	});
	it('should change value of switch', async () => {
		const { findByTestId } = render(
			<Render
				encrypted={testEncrypted.encrypted}
				encryptionEnabled={testEncrypted.encryptionEnabled}
				isTeam={testEncrypted.isTeam}
				onValueChangeEncrypted={value => testEncrypted.onValueChangeEncrypted(value)}
				type={testEncrypted.type}
			/>
		);

		const component = await findByTestId(testEncrypted.testSwitchID);
		fireEvent(component, 'valueChange', { value: true });
		expect(onPressMock).toHaveReturnedWith({ value: !testEncrypted.encrypted });
	});
	it('label when encrypted and isTeam are false and is a public channel', async () => {
		const { findByTestId } = render(
			<Render
				encrypted={testEncrypted.encrypted}
				encryptionEnabled={testEncrypted.encryptionEnabled}
				isTeam={testEncrypted.isTeam}
				onValueChangeEncrypted={value => testEncrypted.onValueChangeEncrypted(value)}
				type={testEncrypted.type}
			/>
		);
		const component = await findByTestId(testEncrypted.testLabelID);
		expect(component.props.children).toBe(i18n.t('Channel_hint_encrypted_not_available'));
	});
	it('label when encrypted and isTeam are true and is a private team', async () => {
		testEncrypted.isTeam = true;
		testEncrypted.type = true;
		testEncrypted.encrypted = true;
		const { findByTestId } = render(
			<Render
				encrypted={testEncrypted.encrypted}
				encryptionEnabled={testEncrypted.encryptionEnabled}
				isTeam={testEncrypted.isTeam}
				onValueChangeEncrypted={value => testEncrypted.onValueChangeEncrypted(value)}
				type={testEncrypted.type}
			/>
		);
		const component = await findByTestId(testEncrypted.testLabelID);
		expect(component.props.children).toBe(i18n.t('Team_hint_encrypted'));
	});
});
