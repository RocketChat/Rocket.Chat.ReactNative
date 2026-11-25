import { store as reduxStore } from '~/lib/store/auxStore';

export function getSenderName(sender: any) {
	const { UI_Use_Real_Name: useRealName } = reduxStore.getState().settings;
	return useRealName ? sender.name : sender.username;
}
