import isEqual from 'lodash/isEqual';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ErrorResult, MatchPathPattern, OperationParams, PathFor, ResultFor, Serialized } from '../../definitions/rest/helpers';
import sdk from '../services/sdk';

export const useEndpointData = <TPath extends PathFor<'GET'>>(
	endpoint: TPath,
	params: void extends OperationParams<'GET', MatchPathPattern<TPath>>
		? void
		: Serialized<OperationParams<'GET', MatchPathPattern<TPath>>> = undefined as void extends OperationParams<
		'GET',
		MatchPathPattern<TPath>
	>
		? void
		: Serialized<OperationParams<'GET', MatchPathPattern<TPath>>>
): {
	result: Serialized<ResultFor<'GET', MatchPathPattern<TPath>>> | undefined;
	loading: boolean;
	reload: Function;
	error: ErrorResult | undefined;
} => {
	const [loading, setLoading] = useState(true);
	const [result, setResult] = useState<Serialized<ResultFor<'GET', MatchPathPattern<TPath>>> | undefined>();
	const [error, setError] = useState<ErrorResult | undefined>();

	const paramsRef = useRef(params);

	if (!isEqual(paramsRef.current, params)) {
		paramsRef.current = params;
	}

	const fetchData = useCallback(() => {
		if (!endpoint) return;
		setLoading(true);
		sdk
			.get(endpoint, params as any)
			.then(e => {
				setLoading(false);
				if (e.success) {
					setResult(e);
				} else {
					setError(e as ErrorResult);
				}
			})
			.catch((e: ErrorResult) => {
				setLoading(false);
				setError(e);
			});
	}, [paramsRef.current]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return {
		result,
		loading,
		reload: fetchData,
		error
	};
};
