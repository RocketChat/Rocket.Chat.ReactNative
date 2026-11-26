type Workspace = 'A' | 'B';
type Certificate = 'c1' | 'c2';
type Phase = 'idle' | 'loadingServers' | 'applying';

const workspaces: Workspace[] = ['A', 'B'];

let workspaceCertificate: Record<Workspace, Certificate | null> = { A: null, B: null };
let certificateFile = new Set<Certificate>();
let hostCertificate: Certificate | null = null;
let listed = new Set<Workspace>();
let connected: Workspace | null = null;
let adding: Workspace | null = null;

let removing: Workspace | null = null;
let removePhase: Phase = 'idle';
let removeServers = new Set<Workspace>();

let unsetting: Workspace | null = null;
let unsetPhase: Phase = 'idle';
let unsetServers = new Set<Workspace>();

let removedByHand: Certificate | null = null;

const firstWithCertificate = (servers: Set<Workspace>): Workspace | null =>
	servers.has('A') && workspaceCertificate.A !== null ? 'A' : servers.has('B') && workspaceCertificate.B !== null ? 'B' : null;

const isCertificateInUse = (certificate: Certificate) => workspaces.some(id => workspaceCertificate[id] === certificate);

const persistCertificate = (workspace: Workspace, certificate: Certificate) => {
	certificateFile.add(certificate);
	hostCertificate = certificate;
	workspaceCertificate[workspace] = certificate;
	if (removedByHand === certificate) {
		removedByHand = null;
	}
};

const applyServerCertificate = (workspace: Workspace) => {
	const name = workspaceCertificate[workspace];
	if (name !== null && certificateFile.has(name)) {
		persistCertificate(workspace, name);
	}
};

const forgetServerCertificate = (workspace: Workspace) => {
	const certificate = workspaceCertificate[workspace];
	workspaceCertificate[workspace] = null;
	if (certificate !== null && !isCertificateInUse(certificate)) {
		certificateFile.delete(certificate);
	}
};

const syncHostCertificate = (servers: Set<Workspace>) => {
	const connectedIsCandidate = connected !== null && servers.has(connected) && workspaceCertificate[connected] !== null;
	const selected = connectedIsCandidate ? connected : firstWithCertificate(servers);
	hostCertificate = null;
	if (selected !== null) {
		applyServerCertificate(selected);
	}
};

/** NewServerView opens with a workspace URL typed in. */
export const openAddWorkspace = (workspace: Workspace) => {
	if (adding !== null) return;
	adding = workspace;
};

/** The user picks a .p12 for the typed workspace (pickCertificate). */
export const pickCertificate = (certificate: Certificate) => {
	if (adding === null) return;
	persistCertificate(adding, certificate);
};

/** The typed workspace connects and the user logs in (handleServerRequest, handleSelectServer). */
export const connectAddedWorkspace = () => {
	if (adding === null) return;
	const workspace = adding;
	connected = workspace;
	applyServerCertificate(workspace);
	listed.add(workspace);
	adding = null;
};

/** The user backs out of NewServerView, which selects the previous workspace again. */
export const leaveAddWorkspace = () => {
	if (adding === null) return;
	adding = null;
	if (connected !== null && listed.has(connected)) {
		applyServerCertificate(connected);
	}
};

/** A listed workspace is selected, by the user, by a saga, or at app start (handleSelectServer). */
export const selectWorkspace = (workspace: Workspace) => {
	if (adding !== null || !listed.has(workspace)) return;
	connected = workspace;
	applyServerCertificate(workspace);
};

/** The user logs out of the connected workspace; its certificate keys stay (logout). */
export const logOut = () => {
	if (adding !== null || connected === null || !listed.has(connected)) return;
	listed.delete(connected);
};

/** The user deletes a workspace other than the current one from the workspace list (removeServer). */
export const removeWorkspace = (workspace: Workspace) => {
	if (adding !== null || removing !== null || !listed.has(workspace) || workspace === connected) return;
	listed.delete(workspace);
	removing = workspace;
	removePhase = 'loadingServers';
};

/** The servers database answers clearRemovedWorkspaceCertificate's getServerIds. */
export const removeWorkspaceLoadsServers = () => {
	if (removePhase !== 'loadingServers') return;
	removeServers = new Set([...listed]);
	removePhase = 'applying';
};

/** clearRemovedWorkspaceCertificate continues with the servers it loaded. */
export const removeWorkspaceClearsCertificate = () => {
	if (removePhase !== 'applying' || removing === null) return;
	const workspace = removing;
	const servers = removeServers;
	removing = null;
	removePhase = 'idle';
	removeServers = new Set<Workspace>();
	if (!servers.has(workspace)) {
		const certificate = workspaceCertificate[workspace];
		forgetServerCertificate(workspace);
		const sameHost = servers.size > 0;
		const sameHostHasCertificate = [...servers].some(id => workspaceCertificate[id] !== null);
		if (!(sameHost && (certificate === null || !sameHostHasCertificate))) {
			syncHostCertificate(servers);
		}
	}
};

/** The user removes the typed workspace's certificate in NewServerView (removeServerCertificate). */
export const unsetCertificate = () => {
	if (adding === null || unsetting !== null || workspaceCertificate[adding] === null) return;
	removedByHand = workspaceCertificate[adding];
	unsetting = adding;
	forgetServerCertificate(adding);
	unsetPhase = 'loadingServers';
};

/** The servers database answers removeServerCertificate's getServerIds. */
export const unsetCertificateLoadsServers = () => {
	if (unsetPhase !== 'loadingServers') return;
	unsetServers = new Set([...listed]);
	unsetPhase = 'applying';
};

/** removeServerCertificate continues with the servers it loaded (syncHostCertificate). */
export const unsetCertificateSyncsHost = () => {
	if (unsetPhase !== 'applying' || unsetting === null) return;
	syncHostCertificate(unsetServers);
	unsetting = null;
	unsetPhase = 'idle';
	unsetServers = new Set<Workspace>();
};

const settled = () => adding === null && removePhase === 'idle' && unsetPhase === 'idle';

/** Once things settle, every certificate a workspace still names can be loaded. */
export const savedCertificateStaysLoadable = () =>
	!settled() || workspaces.every(id => workspaceCertificate[id] === null || certificateFile.has(workspaceCertificate[id]!));

/** Once things settle, a certificate the user removed by hand is not presented unless a workspace still names it. */
export const removedCertificateIsNotPresented = () =>
	!settled() || removedByHand === null || hostCertificate !== removedByHand || isCertificateInUse(removedByHand);
