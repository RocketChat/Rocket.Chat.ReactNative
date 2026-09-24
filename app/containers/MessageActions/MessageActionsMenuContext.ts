import { createContext, useContext } from 'react';

import { type TActionSheetOptionsItem } from '../ActionSheet';
import { type TAnyMessageModel } from '~/definitions';

export interface IMessageActionsMenu {
	getMenuOptions: (message: TAnyMessageModel) => TActionSheetOptionsItem[];
}

export const MessageActionsMenuContext = createContext<IMessageActionsMenu | null>(null);

export const useMessageActionsMenu = (): IMessageActionsMenu | null => useContext(MessageActionsMenuContext);
