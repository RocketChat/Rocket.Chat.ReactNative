import React, { memo } from 'react';
import { shallowEqual } from 'react-redux';

import { usePermissions } from '../../lib/hooks';
import { RenderSwitch } from './RenderSwitch';

export const RenderType = memo(
	({ isTeam, type, onValueChangeType }: { isTeam: boolean; type: boolean; onValueChangeType: (value: boolean) => void }) => {
		const [createChannelPermission, createPrivateChannelPermission] = usePermissions(['create-c', 'create-p']);

		const isDisabled = [createChannelPermission, createPrivateChannelPermission].filter(r => r === true).length <= 1;

		let hint = '';
		if (isTeam && type) {
			hint = 'Team_hint_private';
		}
		if (isTeam && !type) {
			hint = 'Team_hint_public';
		}
		if (!isTeam && type) {
			hint = 'Channel_hint_private';
		}
		if (!isTeam && !type) {
			hint = 'Channel_hint_public';
		}

		return (
			<RenderSwitch
				id={'type'}
				value={createPrivateChannelPermission ? type : false}
				disabled={isDisabled}
				label={'Private'}
				hint={hint}
				onValueChange={onValueChangeType}
			/>
		);
	},
	shallowEqual
);
