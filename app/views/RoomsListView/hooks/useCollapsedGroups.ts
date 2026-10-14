import { useMemo } from 'react';

import { useAppSelector } from '~/lib/hooks/useAppSelector';
import userPreferences, { useUserPreferences } from '~/lib/methods/userPreferences';

const NO_COLLAPSED_GROUPS: string[] = [];

const parseCollapsedGroups = (storedGroups: string | undefined): string[] => {
	try {
		const groups = JSON.parse(storedGroups ?? '[]');
		return Array.isArray(groups) ? groups : NO_COLLAPSED_GROUPS;
	} catch {
		return NO_COLLAPSED_GROUPS;
	}
};

export const useCollapsedGroups = () => {
	const server = useAppSelector(state => state.server.server);
	const storageKey = `${server}-RC_ROOMS_LIST_COLLAPSED_GROUPS`;
	const [storedGroups, setStoredGroups] = useUserPreferences<string>(storageKey);
	const collapsedGroups = useMemo(() => new Set(parseCollapsedGroups(storedGroups)), [storedGroups]);

	const toggleGroup = (group: string) => {
		const groups = parseCollapsedGroups(userPreferences.getString(storageKey) ?? undefined);
		const nextGroups = groups.includes(group) ? groups.filter(collapsed => collapsed !== group) : [...groups, group];
		setStoredGroups(JSON.stringify(nextGroups));
	};

	return { collapsedGroups, toggleGroup };
};
