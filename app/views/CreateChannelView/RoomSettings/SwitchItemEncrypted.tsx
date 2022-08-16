import React, { memo } from 'react';
import { shallowEqual } from 'react-redux';

import { SwitchItem } from './SwitchItem';

export interface ISwitchItemEncrypted {
	encryptionEnabled: boolean;
	isTeam: boolean;
	type: boolean;
	encrypted: boolean;
	onValueChangeEncrypted: (value: boolean) => void;
}

export const SwitchItemEncrypted = memo(
	({ encryptionEnabled, isTeam, type, encrypted, onValueChangeEncrypted }: ISwitchItemEncrypted) => {
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
				disabled={!type}
			/>
		);
	},
	shallowEqual
);
