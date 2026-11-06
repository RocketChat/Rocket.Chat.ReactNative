const AGENT_IDENTITY_PREFIXES = ['agent-', 'agent_'];
const AGENT_JOB_IDENTITY = /^AJ_[A-Za-z0-9]+$/;

export const isAgentParticipant = ({ identity, isAgent }: { identity: string; isAgent?: boolean }): boolean =>
	!!isAgent || AGENT_IDENTITY_PREFIXES.some(prefix => identity.startsWith(prefix)) || AGENT_JOB_IDENTITY.test(identity);
