import React from 'react';

import { SwitchItem } from './SwitchItem';

export const SwitchItemType = ({
	isTeam,
	type,
	onValueChangeType,
	isDisabled
}: {
	isTeam: boolean;
	type: boolean;
	onValueChangeType: (value: boolean) => void;
	isDisabled: boolean;
}) => {
	let hint = '';
	if (isTeam && type) {
		hint = 'Team_hint_private';
	}
	if (isTeam && !type) {
		hint = 'Team_hint_public';
	}
	if (!isTeam) {
		hint = 'Channel_hint_private';
	}

	return (
		<SwitchItem id={'type'} value={type} disabled={isDisabled} label={'Private'} hint={hint} onValueChange={onValueChangeType} />
	);
};
