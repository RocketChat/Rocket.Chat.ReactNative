type Vars = Record<string, any>;

const listedNames = (listed: string[] | Record<string, string>) => Object.values(listed ?? {}).join(', ') || 'none';

export const title = 'iOS client certificate storage';

export const state = (vars: Vars) => ({
	Host: vars.hostCertificate === 'Null' ? 'presents no certificate' : `presents ${vars.hostCertificate}`,
	Workspaces: `listed: ${listedNames(vars.listed)}; connected: ${vars.connected === 'Null' ? 'none' : vars.connected}`,
	Pending:
		vars.removePhase === 'idle' && vars.unsetPhase === 'idle'
			? vars.adding === 'Null'
				? 'settled'
				: `adding ${vars.adding}`
			: 'waiting on getServerIds'
});

const sentences: Record<string, string> = {
	openAddWorkspace: 'you type a workspace URL',
	pickCertificate: 'you pick a certificate',
	connectAddedWorkspace: 'the typed workspace connects',
	leaveAddWorkspace: 'you go back to the previous workspace',
	selectWorkspace: 'a workspace is selected',
	logOut: 'you log out',
	removeWorkspace: 'you delete a workspace',
	removeWorkspaceLoadsServers: 'the workspace list loads for the delete',
	removeWorkspaceClearsCertificate: "the deleted workspace's certificate is cleared",
	unsetCertificate: 'you remove the certificate',
	unsetCertificateLoadsServers: 'the workspace list loads for the removal',
	unsetCertificateSyncsHost: 'the host certificate is re-applied'
};

export const step = (action: string) => sentences[action.split('(')[0]] ?? action;
