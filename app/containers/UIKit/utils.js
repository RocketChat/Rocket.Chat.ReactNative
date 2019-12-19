import React, { useContext, useState } from 'react';
import { BLOCK_CONTEXT } from '@rocket.chat/ui-kit';
import { Alert } from 'react-native';

export const extractText = ({ text } = { text: '' }) => text;

export const defaultContext = {
	action: ({ value }) => Alert.alert(value.toString()),
	state: console.log,
	appId: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
};

export const kitContext = React.createContext(defaultContext);

export const useBlockContext = ({ blockId, actionId, appId }, context) => {
	const [loading, setLoading] = useState(false);
	const { action, appId: appIdFromContext, state } = useContext(kitContext);
	if ([BLOCK_CONTEXT.SECTION, BLOCK_CONTEXT.ACTION].includes(context)) {
		return [{ loading, setLoading }, async({ value }) => {
			setLoading(true);
			await action({
				blockId,
				appId: appId || appIdFromContext,
				actionId,
				value
			});
			setLoading(false);
		}];
	}

	return [{ loading, setLoading }, async({ value }) => {
		setLoading(true);
		await state({
			blockId,
			appId,
			actionId,
			value
		});
		setLoading(false);
	}];
};
