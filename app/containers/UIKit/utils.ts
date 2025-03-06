/* eslint-disable no-shadow */
import { BlockContext } from '@rocket.chat/ui-kit';
import React, { useContext, useState } from 'react';

import { videoConfJoin } from '../../lib/methods/videoConf';
import { IText } from './interfaces';

export const textParser = ([{ text }]: IText[]) => text;

export const defaultContext: any = {
	action: (...args: any) => console.log(args),
	state: console.log,
	appId: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
	errors: {}
};

export const KitContext = React.createContext(defaultContext);

type TObjectReturn = {
	loading: boolean;
	setLoading: React.Dispatch<React.SetStateAction<boolean>>;
	error: any;
	value: any;
	language: any;
};

type TFunctionReturn = (value: any) => Promise<void>;

type TReturn = [TObjectReturn, TFunctionReturn];

interface IUseBlockContext {
	blockId?: string;
	actionId: string;
	appId?: string;
	initialValue?: string;
	url?: string;
}

export const useBlockContext = ({ blockId, actionId, appId, initialValue }: IUseBlockContext, context: BlockContext): TReturn => {
	const { action, appId: appIdFromContext, viewId, state, language, errors, values = {} } = useContext(KitContext);
	const { value = initialValue } = values[actionId] || {};
	const [loading, setLoading] = useState(false);

	const error = errors && actionId && errors[actionId];

	if ([BlockContext.SECTION, BlockContext.ACTION].includes(context)) {
		return [
			{
				loading,
				setLoading,
				error,
				value,
				language
			},
			async ({ value }: any) => {
				setLoading(true);
				try {
					if (appId === 'videoconf-core' && blockId) {
						setLoading(false);
						return videoConfJoin(blockId);
					}
					await action({
						blockId,
						appId: appId || appIdFromContext,
						actionId,
						value,
						viewId
					});
				} catch (e) {
					// do nothing
				}
				setLoading(false);
			}
		];
	}

	return [
		{
			loading,
			setLoading,
			value,
			error,
			language
		},
		async ({ value }: any) => {
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
		}
	];
};
