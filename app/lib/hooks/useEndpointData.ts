import isEqual from 'lodash/isEqual';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
	type ErrorResult,
	type MatchPathPattern,
	type OperationParams,
	type PathFor,
	type ResultFor,
	type Serialized
} from '../../definitions/rest/helpers';
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
				// Type guard: check if e is an object with success property
				if (e && typeof e === 'object' && 'success' in e) {
					if (e.success) {
						setResult(e as Serialized<ResultFor<'GET', MatchPathPattern<TPath>>>);
					} else {
						setError(e as ErrorResult);
					}
				} else {
					// Fallback: treat as success result
					setResult(e as Serialized<ResultFor<'GET', MatchPathPattern<TPath>>>);
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