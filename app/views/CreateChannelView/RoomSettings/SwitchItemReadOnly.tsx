import React from 'react';

import { SwitchItem } from './SwitchItem';

export const SwitchItemReadOnly = ({
	readOnly,
	isTeam,
	onValueChangeReadOnly,
	broadcast
}: {
	readOnly: boolean;
	isTeam: boolean;
	onValueChangeReadOnly: (value: boolean) => void;
	broadcast: boolean;
}) => {
	let hint = '';
	if (readOnly) {
		hint = 'Read_only_hint';
	}
	if (isTeam && !readOnly) {
		hint = 'Team_hint_not_read_only';
	}
	if (!isTeam && !readOnly) {
		hint = 'Channel_hint_not_read_only';
	}

	return (
		<SwitchItem
			id={'readonly'}
			value={readOnly}
			label={'Read_Only'}
			hint={hint}
			onValueChange={onValueChangeReadOnly}
			disabled={broadcast}
		/>
	);
};
