import React, { memo } from 'react';
import { shallowEqual } from 'react-redux';

import { RenderSwitch } from './RenderSwitch';

export interface IRenderEncrypted {
	encryptionEnabled: boolean;
	isTeam: boolean;
	type: boolean;
	encrypted: boolean;
	onValueChangeEncrypted: (value: boolean) => void;
}

export const RenderEncrypted = memo(
	({ encryptionEnabled, isTeam, type, encrypted, onValueChangeEncrypted }: IRenderEncrypted) => {
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
			<RenderSwitch
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
