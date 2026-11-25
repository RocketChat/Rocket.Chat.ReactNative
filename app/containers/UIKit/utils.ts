/* eslint-disable no-shadow */
import { BlockContext } from '@rocket.chat/ui-kit';
import { useContext, useState, createContext, type Dispatch, type SetStateAction } from 'react';

import { videoConfJoin } from '~/lib/methods/videoConf';
import { type IElement, type IText } from './interfaces';

export const textParser = ([{ text }]: IText[]) => text;

export const getInitialValue = ({ initialValue, initialOption }: Pick<IElement, 'initialValue' | 'initialOption'>) =>
	initialValue ?? (Array.isArray(initialOption) ? undefined : initialOption?.value);

export const defaultContext: any = {
	action: (...args: any) => console.log(args),
	state: console.log,
	appId: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
	errors: {}
};

export const KitContext = createContext(defaultContext);

type TObjectReturn = {
	loading: boolean;
	setLoading: Dispatch<SetStateAction<boolean>>;
	error: any;
	value: any;
	language: any;
};

type TFunctionReturn = (value: any) => Promise<boolean>;

type TReturn = [TObjectReturn, TFunctionReturn];

interface IUseBlockContext {
	blockId?: string;
	actionId: string;
	appId?: string;
	initialValue?: string;
	initialOption?: IElement['initialOption'];
	url?: string;
}

export const useBlockContext = (
	{ blockId, actionId, appId, initialValue, initialOption }: IUseBlockContext,
	context: BlockContext
): TReturn => {
	const { action, appId: appIdFromContext, viewId, state, language, errors, values = {} } = useContext(KitContext);
	const { value = getInitialValue({ initialValue, initialOption }) } = values[actionId] || {};
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
						await videoConfJoin(blockId);
						return true;
					}
					await action({
						blockId,
						appId: appId || appIdFromContext,
						actionId,
						value,
						viewId
					});
				} catch (e) {
					setLoading(false);
					return false;
				}
				setLoading(false);
				return true;
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
				setLoading(false);
				return false;
			}
			setLoading(false);
			return true;
		}
	];
};
