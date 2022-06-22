/* eslint-disable no-shadow */
import React, { useContext, useState } from 'react';
import { BlockContext } from '@rocket.chat/ui-kit';

import { IText } from './interfaces';
import { videoConfJoin } from '../../lib/methods/videoConf';
import { TActionSheetOptionsItem, useActionSheet } from '../ActionSheet';
import i18n from '../../i18n';

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
	const { showActionSheet } = useActionSheet();

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
						const options: TActionSheetOptionsItem[] = [
							{
								title: i18n.t('Video_call'),
								icon: 'camera',
								onPress: () => videoConfJoin(blockId, true)
							},
							{
								title: i18n.t('Voice_call'),
								icon: 'microphone',
								onPress: () => videoConfJoin(blockId, false)
							}
						];
						showActionSheet({ options });
						return;
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
