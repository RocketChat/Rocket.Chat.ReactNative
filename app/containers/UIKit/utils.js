import React, { useContext, useState } from 'react';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

export const textParser = ([{ text }]) => text;

export const defaultContext = {
	action: (...args) => console.log(args),
	state: console.log,
	appId: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
	errors: {}
};

export const KitContext = React.createContext(defaultContext);

export const useBlockContext = ({
	blockId, actionId, appId, initialValue
}, context) => {
	const [initial, setInitial] = useState(initialValue);
	const [loading, setLoading] = useState(false);
	const {
		action, appId: appIdFromContext, state, errors, language
	} = useContext(KitContext);
	const error = errors && actionId && errors[actionId];

	if ([BLOCK_CONTEXT.SECTION, BLOCK_CONTEXT.ACTION].includes(context)) {
		return [{
			loading, setLoading, error, language
		}, async({ value }) => {
			setLoading(true);
			try {
				await action({
					blockId,
					appId: appId || appIdFromContext,
					actionId,
					value
				});
			} catch (e) {
				// do nothing
			}
			setLoading(false);
		}];
	}

	return [{
		loading, setLoading, initial, error, language
	}, async({ value }) => {
		setInitial(value);
		setLoading(true);
		try {
			await state({
				blockId,
				appId,
				actionId,
				value
			});
		} catch (e) {
			// do nothing
		}
		setLoading(false);
	}];
};
