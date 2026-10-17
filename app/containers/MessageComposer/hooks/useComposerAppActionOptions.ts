import { useContext } from 'react';

import { type TActionSheetOptionsItem } from '~/containers/ActionSheet';
import { type TIconsName } from '~/containers/CustomIcon';
import { UIActionButtonContext } from '~/lib/apps/definitions';
import { applyCategoryFilter } from '~/lib/apps/filters';
import { triggerAppActionButton } from '~/lib/apps/actions';
import { type IAppActionButtonItem, useAppActionButtons } from '~/lib/apps/useAppActionButtons';
import { useComposerRid, useComposerTmid } from '../ComposerStore';
import { MessageInnerContext } from '../context';

export const useComposerAppActionOptions = (): TActionSheetOptionsItem[] => {
	const rid = useComposerRid();
	const tmid = useComposerTmid();
	const { getText } = useContext(MessageInnerContext);
	const appButtons = useAppActionButtons(rid);
	if (!rid) {
		return [];
	}

	const toOption = (
		{ id, label, button }: IAppActionButtonItem,
		icon: TIconsName,
		testIDPrefix: string
	): TActionSheetOptionsItem => ({
		title: label,
		icon,
		danger: button.variant === 'danger',
		testID: `${testIDPrefix}-${id}`,
		onPress: () => triggerAppActionButton({ button, rid, tmid, message: getText() })
	});

	const aiOptions = appButtons
		.filter(({ button }) => button.context === UIActionButtonContext.ROOM_ACTION && applyCategoryFilter(button, 'ai'))
		.map(item => toOption(item, 'stars', 'message-composer-ai-action'));
	const messageBoxOptions = appButtons
		.filter(({ button }) => button.context === UIActionButtonContext.MESSAGE_BOX_ACTION && applyCategoryFilter(button, 'default'))
		.map(item => toOption(item, 'apps', 'message-composer-app-action'));

	return [...aiOptions, ...messageBoxOptions];
};
