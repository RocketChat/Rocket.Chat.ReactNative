import React from 'react';

import { SwitchItem } from './SwitchItem';

export interface ISwitchItemEncrypted {
	encryptionDisabled: boolean;
	isTeam: boolean;
	type: boolean;
	encrypted?: boolean;
	onValueChangeEncrypted: (value: boolean) => void;
	disabled?: boolean;
}

export const SwitchItemEncrypted = ({
	encryptionDisabled,
	isTeam,
	type,
	encrypted,
	onValueChangeEncrypted,
	disabled
}: ISwitchItemEncrypted) => {
	if (encryptionDisabled) {
		return null;
	}

	let hint = '';
	if (isTeam && type) {
		hint = 'Team_hint_encrypted';
	}
	if (isTeam && !type) {
		hint = 'Team_hint_encrypted_not_available';
	}
	if (!isTeam && type) {
		hint = 'Channel_hint_encrypted';
	}
	if (!isTeam && !type) {
		hint = 'Channel_hint_encrypted_not_available';
	}

	return (
		<SwitchItem
			id={'encrypted'}
			value={encrypted}
			label={'Encrypted'}
			hint={hint}
			onValueChange={onValueChangeEncrypted}
			disabled={disabled || !type}
		/>
	);
};
