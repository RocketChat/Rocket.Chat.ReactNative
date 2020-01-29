import React, { useContext, useState } from 'react';
import { uiKitText, BLOCK_CONTEXT } from '@rocket.chat/ui-kit';

export const textParser = uiKitText(new class {
	plain_text = ({ text }) => text;

	text = ({ text }) => text;
}());

export const defaultContext = {
	action: (...args) => console.log(args),
	state: console.log,
	appId: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
};

export const KitContext = React.createContext(defaultContext);

export const useBlockContext = ({
	blockId, actionId, appId, initialValue
}, context) => {
	const [initial, setInitial] = useState(initialValue);
	const [loading, setLoading] = useState(false);
	const { action, appId: appIdFromContext, state } = useContext(KitContext);
	if ([BLOCK_CONTEXT.SECTION, BLOCK_CONTEXT.ACTION].includes(context)) {
		return [{ loading, setLoading }, async({ value }) => {
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

	return [{ loading, setLoading, initial }, async({ value }) => {
		setInitial(initial);
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
