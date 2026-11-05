export const getHiddenSystemMessages = (roomSysMes: unknown, workspaceHidden: unknown): string[] => {
	const fromRoom = Array.isArray(roomSysMes) ? roomSysMes : [];
	const fromWorkspace = Array.isArray(workspaceHidden) ? workspaceHidden : [];
	return Array.from(new Set<string>([...fromWorkspace, ...fromRoom]));
};
