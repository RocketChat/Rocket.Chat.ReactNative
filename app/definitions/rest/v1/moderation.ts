export type ModerationEndpoints = {
	'moderation.reportUser': {
		POST: (params: { userId: string; description: string }) => void;
	};
};
