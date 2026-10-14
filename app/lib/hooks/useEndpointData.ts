import { useEffect, useState } from 'react';

import {
	type ErrorResult,
	type MatchPathPattern,
	type OperationParams,
	type PathFor,
	type ResultFor,
	type Serialized
} from '~/definitions/rest/helpers';
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
	const [reloadCount, setReloadCount] = useState(0);
	const [response, setResponse] = useState<{
		requestKey: string;
		result?: Serialized<ResultFor<'GET', MatchPathPattern<TPath>>>;
		error?: ErrorResult;
	}>();

	const paramsKey = JSON.stringify(params);
	const requestKey = JSON.stringify([endpoint, paramsKey, reloadCount]);

	useEffect(() => {
		if (!endpoint) return;
		let ignore = false;
		sdk
			.get(endpoint, paramsKey === undefined ? undefined : JSON.parse(paramsKey))
			.then(e => {
				if (ignore) return;
				setResponse(previous =>
					e.success
						? { requestKey, result: e, error: previous?.error }
						: { requestKey, result: previous?.result, error: e as ErrorResult }
				);
			})
			.catch((e: ErrorResult) => {
				if (ignore) return;
				setResponse(previous => ({ requestKey, result: previous?.result, error: e }));
			});
		return () => {
			ignore = true;
		};
	}, [endpoint, paramsKey, requestKey]);

	const reload = () => setReloadCount(count => count + 1);

	return {
		result: response?.result,
		loading: response?.requestKey !== requestKey,
		reload,
		error: response?.error
	};
};
