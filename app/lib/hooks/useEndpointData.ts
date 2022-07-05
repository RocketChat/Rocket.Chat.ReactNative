import { MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';

import { MatchPathPattern, OperationParams, PathFor, ResultFor, Serialized } from '../../definitions/rest/helpers';
import { showErrorAlert } from '../methods/helpers';
import sdk from '../services/sdk';

type TError = {
	success: boolean;
	error: string;
	errorType: string;
	details: {
		method: string;
	};
};

export const useEndpointData = <TPath extends PathFor<'GET'>>(
	endpoint: TPath,
	params: void extends OperationParams<'GET', MatchPathPattern<TPath>>
		? void
		: Serialized<OperationParams<'GET', MatchPathPattern<TPath>>> = undefined as void extends OperationParams<
		'GET',
		MatchPathPattern<TPath>
	>
		? void
		: Serialized<OperationParams<'GET', MatchPathPattern<TPath>>>,
	cache?: boolean
): { result: Serialized<ResultFor<'GET', MatchPathPattern<TPath>>> | undefined; loading: boolean; reload: Function } => {
	const [loading, setLoading] = useState(true);
	const [result, setResult] = useState<Serialized<ResultFor<'GET', MatchPathPattern<TPath>>> | undefined>();
	const localCache = useRef({}) as MutableRefObject<{ [key in TPath]: Serialized<ResultFor<'GET', MatchPathPattern<TPath>>> }>;
	// wm cache?

	const fetchData = useCallback(() => {
		if (!endpoint) return;
		if (cache && localCache.current[endpoint]) {
			setResult(localCache.current[endpoint]);
			return;
		}
		setLoading(true);
		sdk
			.get(endpoint, params)
			.then(e => {
				setLoading(false);
				if (e.success) {
					setResult(e);
					localCache.current[endpoint] = e;
				} else {
					// handle error
				}
			})
			.catch((e: TError) => {
				// handle error
				setLoading(false);
				showErrorAlert(e.error);
			});
	}, [params]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return {
		result,
		loading,
		reload: fetchData
	};
};
