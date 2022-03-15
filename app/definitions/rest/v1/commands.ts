export type CommandsEndpoints = {
	'commands.run': {
		POST: (params: { command: string; roomId: string; params: string; triggerId?: string; tmid?: string }) => {};
	};
};
