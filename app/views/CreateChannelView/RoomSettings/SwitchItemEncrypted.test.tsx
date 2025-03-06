import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import i18n from '../../../i18n';
import { SwitchItemEncrypted } from './SwitchItemEncrypted';

const onPressMock = jest.fn((value: boolean) => value);

describe('SwitchItemEncrypted', () => {
	const testEncrypted = {
		encrypted: false,
		encryptionEnabled: false,
		isTeam: false,
		onValueChangeEncrypted: onPressMock,
		type: false,
		testSwitchID: 'create-channel-encrypted',
		testLabelID: `create-channel-encrypted-hint`
	};

	it('should not render the Encrypted Switch component', () => {
		render(
			<SwitchItemEncrypted
				encrypted={testEncrypted.encrypted}
				encryptionEnabled={testEncrypted.encryptionEnabled}
				isTeam={testEncrypted.isTeam}
				onValueChangeEncrypted={value => testEncrypted.onValueChangeEncrypted(value)}
				type={testEncrypted.type}
			/>
		);
		const component = screen.queryByTestId(testEncrypted.testSwitchID);
		expect(component).toBeNull();
	});

	it('should render the Encrypted Switch component', () => {
		testEncrypted.encryptionEnabled = true;
		render(
			<SwitchItemEncrypted
				encrypted={testEncrypted.encrypted}
				encryptionEnabled={testEncrypted.encryptionEnabled}
				isTeam={testEncrypted.isTeam}
				onValueChangeEncrypted={value => testEncrypted.onValueChangeEncrypted(value)}
				type={testEncrypted.type}
			/>
		);
		const component = screen.queryByTestId(testEncrypted.testSwitchID);
		expect(component).toBeTruthy();
	});

	it('should change value of switch', () => {
		render(
			<SwitchItemEncrypted
				encrypted={testEncrypted.encrypted}
				encryptionEnabled={testEncrypted.encryptionEnabled}
				isTeam={testEncrypted.isTeam}
				onValueChangeEncrypted={value => testEncrypted.onValueChangeEncrypted(value)}
				type={testEncrypted.type}
			/>
		);
		const component = screen.queryByTestId(testEncrypted.testSwitchID);
		if (component) {
			fireEvent(component, 'valueChange', { value: true });
			expect(onPressMock).toHaveReturnedWith({ value: !testEncrypted.encrypted });
		}
	});

	it('label when encrypted and isTeam are true and is a private team', () => {
		testEncrypted.isTeam = true;
		testEncrypted.type = true;
		testEncrypted.encrypted = true;
		render(
			<SwitchItemEncrypted
				encrypted={testEncrypted.encrypted}
				encryptionEnabled={testEncrypted.encryptionEnabled}
				isTeam={testEncrypted.isTeam}
				onValueChangeEncrypted={value => testEncrypted.onValueChangeEncrypted(value)}
				type={testEncrypted.type}
			/>
		);
		const component = screen.queryByTestId(testEncrypted.testLabelID);
		expect(component?.props.children).toBe(i18n.t('Team_hint_encrypted'));
	});
});
