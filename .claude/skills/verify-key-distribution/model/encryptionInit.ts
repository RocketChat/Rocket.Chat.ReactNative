// Model of handleEncryptionInit (app/sagas/encryption.js) and the key work it starts in app/lib/encryption/encryption.ts,
// against logout, workspace switches and repeated logins. See ../SKILL.md for the coverage table.
// A workspace's name also names its signed-in user: the keys "A" are the private key of workspace A's user.

type Workspace = 'A' | 'B';
type ServerKeys = 'None' | 'Own' | 'Foreign';
// The awaits of handleEncryptionInit: serversCollection.find, e2eFetchMyKeys, then Encryption.persistKeys or createKeys.
type InitStep = 'Find' | 'Fetch' | 'Keys';
// The async work a saga cancel does not stop: persistKeys' rsaImportKey; createKeys' key generation,
// its password and private key encoding, and its e2e.setUserPublicAndPrivateKeys post.
type OpKind = 'Import' | 'Generate' | 'Encode' | 'Upload';

type Init = {
	workspace: Workspace;
	// The stop count when this ENCRYPTION.INIT started.
	epoch: number;
	step: InitStep;
	// storedPrivateKey, read before e2eFetchMyKeys.
	readPrivateKey: boolean;
	// e2eFetchMyKeys went to this workspace's signed-in client and was not aborted.
	fetchCanSucceed: boolean;
};

type Op = {
	kind: OpKind;
	// The `server` argument: whose UserPreferences keys the op writes.
	workspace: Workspace;
	// Whose private key the op imports or generated.
	owner: Workspace;
	// The stop count when the init that started this op began.
	epoch: number;
	// The running handleEncryptionInit saga yields this op's promise.
	awaited: boolean;
	// Upload only: the workspace whose signed-in client sent the post, null when it had none or the post was aborted.
	target: Workspace | null;
};

// sdk.current: the workspace the app is connected to, and whether its session is still valid.
let connected: Workspace | null = null;
let authenticated = false;
// handleSelectServer put encryptionStop for this workspace and has not reached connect() yet; sdk.host is still `connected`.
let switchingTo: Workspace | null = null;
// Encryption.userId and Encryption.privateKey: whose user and whose key the client runs with.
let clientUser: Workspace | null = null;
let clientKey: Workspace | null = null;
// UserPreferences `${server}-${E2E_PRIVATE_KEY}`: whose private key is stored for each workspace.
let storedKey!: Record<Workspace, Workspace | null>;
// What each workspace's server holds as its user's E2E keys.
let serverKeys!: Record<Workspace, ServerKeys>;
// Logout's removeServerKeys ran for the workspace and nobody has signed in there since.
let keysRemoved: Record<Workspace, boolean> = { A: false, B: false };
// Encryption.stop() calls so far.
let epoch = 0;
// takeLatest(ENCRYPTION.INIT): at most one running saga.
let init: Init | null = null;
let ops: Op[] = [];
// handleLogout's logout(): 0 idle, 1 awaiting clearServerCookies/removePushToken, 2 sdk.logout and disconnect done.
let logoutPhase = 0;
let logoutWorkspace: Workspace | null = null;
let logins = 0;

// The workspace whose stale init (started before the last stop) started the running client; null once a stop or a fresh init replaces it.
let staleClientFor: Workspace | null = null;
let keyStoredAfterLogout = false;

const MAX_LOGINS = 3;
const MAX_EPOCH = 2;

/** A's user has no E2E keys anywhere yet. B's user either has none either, or has them on the server and on this device. @initially */
export const startsConsistent = () =>
	storedKey.A === null &&
	serverKeys.A === 'None' &&
	((storedKey.B === null && serverKeys.B === 'None') || (storedKey.B === 'B' && serverKeys.B === 'Own'));

// Encryption.stop(): sagas/encryption.js handleEncryptionStop.
const stopClient = () => {
	clientUser = null;
	clientKey = null;
	staleClientFor = null;
	epoch += 1;
};

// End of handleEncryptionInit: encryptionSet(true), then Encryption.initialize(user.id).
const finishInit = () => {
	if (init === null) return;
	if (init.epoch !== epoch) {
		staleClientFor = init.workspace;
	} else {
		staleClientFor = null;
	}
	clientUser = init.workspace;
	init = null;
};

// handleEncryptionInit's catch: the saga logs and ends.
const failInit = () => {
	init = null;
};

const dropOp = (index: number) => {
	ops = ops.slice(0, index).concat(ops.slice(index + 1));
};

// connect.ts connect() → sdk.abort(): every REST request in flight rejects.
const abortRequests = () => {
	if (init !== null && init.step === 'Fetch') {
		init = { ...init, fetchCanSucceed: false };
	}
	ops = ops.map(op => (op.kind === 'Upload' ? { ...op, target: null } : op));
};

/** selectServer.ts handleSelectServer for another workspace: sdk.host differs, so put(encryptionStop()); the socket is untouched until connect(). */
export const selectWorkspace = (workspace: Workspace) => {
	if (connected === workspace || switchingTo !== null || logoutPhase !== 0 || epoch >= MAX_EPOCH) return;
	stopClient();
	switchingTo = workspace;
};

/** handleSelectServer reaches connect.ts connect(): abort() rejects every REST request in flight, then the new workspace connects; its session is not resumed yet. */
export const switchConnects = () => {
	if (switchingTo === null) return;
	abortRequests();
	connected = switchingTo;
	authenticated = false;
	switchingTo = null;
};

/** The connected workspace is selected again before connect(): takeLatest cancels the switch, sdk.host still matches and a session token is stored, so SELECT_CANCEL without an abort and without a new encryptionInit. An init saga already running keeps running. */
export const reselectBeforeConnect = () => {
	if (switchingTo === null) return;
	switchingTo = null;
};

/** login.js handleLoginSuccess: the session on the connected workspace is resumed or signed in, and put(encryptionInit()); takeLatest cancels a running init saga, not the promise it waits on. */
export const loginSucceeds = () => {
	if (connected === null || switchingTo !== null || logoutPhase !== 0 || logins >= MAX_LOGINS || ops.length > 2) return;
	logins += 1;
	authenticated = true;
	keysRemoved[connected] = false;
	ops = ops.map(op => ({ ...op, awaited: false }));
	init = { workspace: connected, epoch, step: 'Find', readPrivateKey: false, fetchCanSucceed: false };
};

/** login.js handleLogout: put(encryptionStop()), then logout() starts awaiting clearServerCookies and removePushToken. Nothing aborts REST requests. */
export const logoutStarts = () => {
	if (connected === null || !authenticated || switchingTo !== null || logoutPhase !== 0 || epoch >= MAX_EPOCH) return;
	stopClient();
	logoutPhase = 1;
	logoutWorkspace = connected;
};

/** logout.ts logout(): sdk.logout() ends the session, then disconnect() drops the client. */
export const logoutEndsSession = () => {
	if (logoutPhase !== 1) return;
	authenticated = false;
	connected = null;
	logoutPhase = 2;
};

/** logout.ts removeServerData → removeServerKeys: the workspace's stored E2E keys are removed. */
export const logoutRemovesKeys = () => {
	if (logoutPhase !== 2 || logoutWorkspace === null) return;
	storedKey[logoutWorkspace] = null;
	keysRemoved[logoutWorkspace] = true;
	logoutPhase = 0;
	logoutWorkspace = null;
};

/** handleEncryptionInit: serversCollection.find(server) resolves (E2E is on), storedPrivateKey is read, and e2eFetchMyKeys is sent on the current client. */
export const serverInfoResolves = () => {
	if (init === null || init.step !== 'Find') return;
	init = {
		...init,
		step: 'Fetch',
		readPrivateKey: storedKey[init.workspace] !== null,
		fetchCanSucceed: connected === init.workspace && authenticated
	};
};

/** e2eFetchMyKeys resolves, or throws. Then storedPublicKey is read: password banner, persistKeys of the stored keys, or createKeys. */
export const myKeysResolve = (succeeds: boolean) => {
	if (init === null || init.step !== 'Fetch') return;
	if (!succeeds || !init.fetchCanSucceed) {
		failInit();
		return;
	}
	const workspace = init.workspace;
	if (!init.readPrivateKey && serverKeys[workspace] !== 'None') {
		failInit();
		return;
	}
	const stored = storedKey[workspace];
	if (init.readPrivateKey && stored !== null) {
		ops.push({ kind: 'Import', workspace, owner: stored, epoch: init.epoch, awaited: true, target: null });
	} else {
		ops.push({ kind: 'Generate', workspace, owner: workspace, epoch: init.epoch, awaited: true, target: null });
	}
	init = { ...init, step: 'Keys' };
};

/** encryption.ts persistKeys: `this.privateKey = await rsaImportKey(...)`, then both keys are written to UserPreferences. */
export const keyImportResolves = (index: 0 | 1 | 2 | 3) => {
	if (index >= ops.length || ops[index].kind !== 'Import') return;
	const op = ops[index];
	clientKey = op.owner;
	storedKey[op.workspace] = op.owner;
	if (keysRemoved[op.workspace]) {
		keyStoredAfterLogout = true;
	}
	dropOp(index);
	if (op.awaited) {
		finishInit();
	}
};

/** encryption.ts createKeys: rsaGenerateKeys and rsaExportKey resolve, and persistKeys starts without an await. */
export const keysGenerated = (index: 0 | 1 | 2 | 3) => {
	if (index >= ops.length || ops[index].kind !== 'Generate') return;
	const op = ops[index];
	ops = ops.with(index, { ...op, kind: 'Encode' });
	ops.push({ kind: 'Import', workspace: op.workspace, owner: op.owner, epoch: op.epoch, awaited: false, target: null });
};

/** createKeys: createRandomPassword and encodePrivateKey resolve, then e2eSetUserPublicAndPrivateKeys posts on the current client. */
export const keyEncoded = (index: 0 | 1 | 2 | 3) => {
	if (index >= ops.length || ops[index].kind !== 'Encode') return;
	ops = ops.with(index, { ...ops[index], kind: 'Upload', target: authenticated ? connected : null });
};

/** e2e.setUserPublicAndPrivateKeys lands: the server refuses without a session or when its user already has keys. Then e2eRequestSubscriptionKeys. */
export const keyUploadResolves = (index: 0 | 1 | 2 | 3) => {
	if (index >= ops.length || ops[index].kind !== 'Upload') return;
	const op = ops[index];
	dropOp(index);
	const target = op.target;
	if (target === null || serverKeys[target] !== 'None') {
		if (op.awaited) {
			failInit();
		}
		return;
	}
	serverKeys[target] = target === op.owner ? 'Own' : 'Foreign';
	if (op.awaited) {
		finishInit();
	}
};

/** An init that started before a stop never leaves the Encryption client running for a session that has ended: once the workspace it started for is no longer connected and signed in. */
export const noStaleClientStart = () => staleClientFor === null || (connected === staleClientFor && authenticated);

/** After logout removes a workspace's E2E keys, they stay off the device until someone signs in there again. */
export const logoutForgetsKeys = () => !keyStoredAfterLogout;

/** A running Encryption client never holds another user's private key. */
export const clientKeyMatchesUser = () => clientUser === null || clientKey === null || clientKey === clientUser;

/** A workspace's server only ever holds its own user's E2E keys. */
export const serverKeysStayOwn = () => serverKeys.A !== 'Foreign' && serverKeys.B !== 'Foreign';

/** @terminating */
export const settled = () => init === null && ops.length === 0;
