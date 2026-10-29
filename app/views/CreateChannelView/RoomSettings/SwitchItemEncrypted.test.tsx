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

	it('label when encrypted and isTeam are true and is a private team', () => {
		renderSwitchItemEncrypted({ encryptionEnabled: true, isTeam: true, type: true, encrypted: true });
		expect(screen.getByTestId(hintTestID)).toHaveTextContent(i18n.t('Team_hint_encrypted'));
	});
});
