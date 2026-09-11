import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { routingConfigRequest } from '../actions/routingConfig';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';

export function useCanReturnQueue(enabled: boolean): boolean {
	const dispatch = useDispatch();
	const returnQueue = useAppSelector(state => state.routingConfig.returnQueue);

	useEffect(() => {
		if (enabled && returnQueue === null) {
			dispatch(routingConfigRequest());
		}
	}, [dispatch, enabled, returnQueue]);

	return enabled && returnQueue === true;
}
