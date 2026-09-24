import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMessageActionsMenu } from '~/containers/MessageActions/MessageActionsMenuContext';
import { MAX_SIDEBAR_WIDTH } from '~/lib/constants/tablet';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { useSetting } from '~/lib/hooks/useSetting';
import { isIOS } from '~/lib/methods/helpers';
import { useMessageField, useMessageItem, useMessageTouchable } from '../stores/MessageStore';
import { useIsThreadRoom } from '../stores/MessageRoomStore';

const useMessageRowWidth = (): number => {
	const { width } = useSafeAreaFrame();
	const { left, right } = useSafeAreaInsets();
	const isMasterDetail = useMasterDetail();
	const sidebarWidth = isMasterDetail ? MAX_SIDEBAR_WIDTH : 0;
	return width - sidebarWidth - left - right;
};

export const useIsMessageContextMenuEnabled = (): boolean => {
	const menu = useMessageActionsMenu();
	const tmid = useMessageField(item => item.tmid);
	const { longPressable } = useMessageTouchable();
	const isThreadRoom = useIsThreadRoom();
	const isThreadMessageInMainRoom = !!tmid && !isThreadRoom;
	return isIOS && !!menu && longPressable && !isThreadMessageInMainRoom;
};

export const useMessageContextMenu = () => {
	const menu = useMessageActionsMenu();
	const item = useMessageItem();
	const enabled = useIsMessageContextMenuEnabled();
	const useRealName = useSetting('UI_Use_Real_Name') as boolean;
	const width = useMessageRowWidth();

	const options = enabled && menu ? menu.getMenuOptions(item) : [];
	const author = item.alias || (useRealName && item.u?.name) || item.u?.username || '';
	const text = item.attachments?.[0]?.description || item.msg || '';

	return { enabled, options, author, text, width };
};
