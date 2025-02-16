import { BlockContext } from '@rocket.chat/ui-kit';
import React, { useContext, useState } from 'react';

import { videoConfJoin } from '../../lib/methods/videoConf';
import type { IText } from './interfaces';
import type { IBlockAction, IBlockActionParams } from '../message/interfaces';

export const textParser = ([{ text }]: IText[]) => text;
export interface IKitContext {
	action: IBlockAction;
	state?: (params: IBlockActionParams) => void;
	rid: string;
	appId: string;
	blockId?: string;
	errors?: Record<string, string>;
	values?: Record<string, Record<string, any>>;
	language?: string;
	viewId?: string;
}

export const defaultContext: IKitContext = {
	action: (...args) => Promise.resolve(console.log(args)),
	state: console.log,
	rid: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
	appId: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
	blockId: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
	errors: {} as Record<string, any>,
	values: {} as Record<string, any>,
	language: 'en',
	viewId: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
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
	const { value = initialValue } = values[actionId] ?? {};
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
						appId: appId ?? appIdFromContext,
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
		async ({ value }) => {
			setLoading(true);
			try {
				await state?.({
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
