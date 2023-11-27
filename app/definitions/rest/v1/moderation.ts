export type ModerationEndpoints = {
	'/v1/moderation.reportUser': {
		POST: (params: { userId: string; description: string }) => void;
	};
};
