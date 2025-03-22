import React, { useEffect } from 'react';

import Status from './Status';
import { IStatus } from './definition';
import { useAppSelector } from '../../lib/hooks';
import { getUserPresence } from '../../lib/methods';

const StatusContainer = ({ id, style, status, size = 32, ...props }: IStatus): React.ReactElement => {
	const connected = useAppSelector(state => state.meteor.connected);
	const statusState = useAppSelector(state => {
		if (state.settings.Presence_broadcast_disabled) {
			return 'disabled';
		}
		if (state.meteor.connected && state.activeUsers[id]) {
			return state.activeUsers[id].status;
		}
		if (!state.meteor.connected) {
			return 'offline';
		}
		return 'loading';
	});

	useEffect(() => {
		if (connected && statusState === 'loading' && !status) {
			getUserPresence(id);
		}
	}, [connected, statusState]);

	return <Status size={size} style={style} status={status ?? statusState} {...props} />;
};

export default StatusContainer;
