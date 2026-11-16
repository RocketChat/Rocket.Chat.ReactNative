import { type ISubscription } from '~/definitions';
import { type TSettingsValues } from '~/reducers/settings';

export const getHiddenSystemMessages = (
	roomSysMes: ISubscription['sysMes'],
	workspaceHidden: TSettingsValues | undefined
): string[] => {
	const fromRoom = Array.isArray(roomSysMes) ? roomSysMes : [];
	const fromWorkspace = Array.isArray(workspaceHidden) ? workspaceHidden : [];
	return Array.from(new Set([...fromWorkspace, ...fromRoom]));
};
