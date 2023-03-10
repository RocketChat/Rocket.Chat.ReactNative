import React from 'react';

import { TUserStatus } from '../../definitions';
import Status from './Status';
import { IStatus } from './definition';
import { useAppSelector } from '../../lib/hooks';

const StatusContainer = ({ id, style, size = 32, ...props }: Omit<IStatus, 'status'>): React.ReactElement => {
	const status = useAppSelector(state => {
		if (state.settings.Presence_broadcast_disabled) {
			return 'disabled';
		}
		if (state.meteor.connected) {
			return state.activeUsers[id] && state.activeUsers[id].status;
		}
		return 'loading';
	}) as TUserStatus;
	return <Status size={size} style={style} status={status} {...props} />;
};

export default StatusContainer;
