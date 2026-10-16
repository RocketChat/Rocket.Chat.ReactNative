import { type TActionSheetOptionsItem } from '~/containers/ActionSheet';
import { type TIconsName } from '~/containers/CustomIcon';
import { UIActionButtonContext } from './definitions';
import { applyCategoryFilter } from './filters';
import { triggerAppActionButton } from './triggerActions';
import { type IAppActionButtonItem, useAppActionButtons } from './useAppActionButtons';

interface IUseComposerAppActionOptions {
	rid?: string;
	tmid?: string;
	getText: () => string | undefined;
}

export const useComposerAppActionOptions = ({ rid, tmid, getText }: IUseComposerAppActionOptions): TActionSheetOptionsItem[] => {
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
