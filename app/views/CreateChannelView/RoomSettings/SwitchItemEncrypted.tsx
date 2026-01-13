import React from 'react';

import { SwitchItem } from './SwitchItem';

export interface ISwitchItemEncrypted {
	encryptionEnabled: boolean;
	isTeam: boolean;
	type: boolean;
	encrypted: boolean;
	onValueChangeEncrypted: (value: boolean) => void;
}

export const SwitchItemEncrypted = ({
	encryptionEnabled,
	isTeam,
	type,
	encrypted,
	onValueChangeEncrypted
}: ISwitchItemEncrypted) => {
	if (!encryptionEnabled) {
		return null;
	}

	let hint = '';
	if (isTeam && type) {
		hint = 'Team_hint_encrypted';
	}
	if (isTeam && !type) {
		hint = 'Team_hint_encrypted_not_available';
	}
	if (!isTeam) {
		hint = 'Channel_hint_encrypted';
	}

	return (
		<SwitchItem
			id={'encrypted'}
			value={encrypted}
			label={'Encrypted'}
			hint={hint}
			onValueChange={onValueChangeEncrypted}
			disabled={!type}
		/>
	);
};
