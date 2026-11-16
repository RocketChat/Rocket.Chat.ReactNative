import { render, screen } from '@testing-library/react-native';

import i18n from '~/i18n';
import { SwitchItemEncrypted, type ISwitchItemEncrypted } from './SwitchItemEncrypted';

const switchTestID = 'create-channel-encrypted';
const hintTestID = 'create-channel-encrypted-hint';

const renderSwitchItemEncrypted = (overrides: Partial<ISwitchItemEncrypted> = {}) =>
	render(
		<SwitchItemEncrypted
			encrypted={overrides.encrypted ?? false}
			encryptionEnabled={overrides.encryptionEnabled ?? false}
			isTeam={overrides.isTeam ?? false}
			onValueChangeEncrypted={overrides.onValueChangeEncrypted ?? jest.fn()}
			type={overrides.type ?? false}
		/>
	);

describe('SwitchItemEncrypted', () => {
	it('should not render the Encrypted Switch component', () => {
		renderSwitchItemEncrypted({ encryptionEnabled: false });
		expect(screen.queryByTestId(switchTestID)).toBeNull();
	});

	it('should render the Encrypted Switch component', () => {
		renderSwitchItemEncrypted({ encryptionEnabled: true });
		expect(screen.getByTestId(switchTestID)).toBeOnTheScreen();
	});

	it.each([
		{ isTeam: true, type: true, hint: 'Team_hint_encrypted' },
		{ isTeam: true, type: false, hint: 'Team_hint_encrypted_not_available' },
		{ isTeam: false, type: true, hint: 'Channel_hint_encrypted' }
	])('shows $hint when isTeam is $isTeam and type is $type', ({ isTeam, type, hint }) => {
		renderSwitchItemEncrypted({ encryptionEnabled: true, isTeam, type });
		expect(screen.getByTestId(hintTestID)).toHaveTextContent(i18n.t(hint));
	});
});
