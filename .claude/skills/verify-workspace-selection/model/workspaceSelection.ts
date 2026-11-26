// Model of how the app selects a workspace (app/sagas/selectServer.ts handleSelectServer) and of every flow that
// dispatches the select: boot, Add workspace and Connect, closing Add workspace, the workspace switcher, sign-in on
// the workspace screen, logout and the share extension. Every action names the code it stands for; see ../SKILL.md.

type Server = 'A' | 'B';
type Root = 'Loading' | 'Inside' | 'Outside' | 'LoadingShare' | 'Share';
// What UserPreferences holds for a workspace (app/lib/methods/loggedInServer.ts getStoredSession):
// SignedIn = userId and token; UserIdOnly = userId whose token migrateTokenKeysToServerScoped dropped; None = nothing.
type Stored = 'SignedIn' | 'UserIdOnly' | 'None';
type Share = 'Idle' | 'Unlocking' | 'Waiting' | 'Shown' | 'GaveUp';
type Outcome = 'None' | 'Cancel' | 'Success' | 'Failure';
// The root handleSelectServer itself put: Inside, Outside, or nothing (startInsideUnlessSharing skipped it).
type PutRoot = 'Inside' | 'Outside' | 'Skipped';

// A, the workspace in CURRENT_SERVER, starts signed in, with a userId whose token the migration drops
// (two workspaces sharing a userId, migrateTokenKeysToServerScoped.ts:41), or with nothing. B starts without a login.
let storedA: Stored;
let storedB: Stored = 'None';
// UserPreferences CURRENT_SERVER.
let currentServer: Server | null = 'A';
// state.app.root (app/reducers/app.ts). Loading is the splash (or ROOT_LOADING while logging out).
let root: Root = 'Loading';
// appInit() dispatched, init.js restore not run yet.
let initPending = true;
// sdk.host (app/lib/services/sdk.ts): set by connect() (connect.ts sdk.initialize), null after disconnect().
let sdkHost: Server | null = null;
// The workspace whose user (with a token) is in state.login.user; null after clearUser or LOGOUT.
let user: Server | null = null;
// state.server.server, set on SERVER.SELECT_REQUEST (app/reducers/server.ts).
let selected: Server | null = null;
// state.server.previousServer, set by serverInitAdd when Add workspace opens.
let previousServer: Server | null = null;
// The handleSelectServer task under takeLatest(SERVER.SELECT_REQUEST); a newer request replaces it.
let selectPending: Server | null = null;
// The pending handleSelectServer has run connect() and has SELECT_SUCCESS left to put.
let selectConnected = false;
// handleLoginRequest for the resume login connect() requests when state.login.user has a token.
let loginPending: Server | null = null;
// connect() aborted a pending login; its handleLoginRequest has LOGIN.FAILURE left to put.
let abortedLoginFailurePending = false;
// handleLogout is running (ROOT_LOADING) for the workspace it read from state.server.server at its start (login.js:403);
// it ends by selecting another logged-in workspace or ROOT_OUTSIDE.
let logoutPending = false;
let logoutServer: Server | null = null;
// handleShareExtension (app/sagas/deepLinking.js:213) and the workspace it read from CURRENT_SERVER.
let share: Share = 'Idle';
let shareServer: Server | null = null;

// What the pending select saw and did, and what the last one that ended saw and did.
let selectHadLogin = false;
let selectWasLive = false;
let selectReconnected = false;
let selectPutRoot: PutRoot = 'Skipped';
let lastOutcome: Outcome = 'None';
let lastServer: Server | null = null;
let lastHadLogin = false;
let lastWasLive = false;
let lastReconnected = false;
let lastPutRoot: PutRoot = 'Skipped';
let lastHost: Server | null = null;

const storedOf = (s: Server): Stored => (s === 'A' ? storedA : storedB);
const hasToken = (s: Server) => storedOf(s) === 'SignedIn';
const hasUserId = (s: Server) => storedOf(s) !== 'None';
const isSharing = (r: Root) => r === 'Share' || r === 'LoadingShare';

// The user can't tap anything while init.js restore, the share extension's unlock or a saga step that awaits no network runs:
// the splash or the passcode screen covers the app, or the step ends before a tap could land.
const userCanTap = () =>
	!initPending && !logoutPending && selectPending === null && share !== 'Unlocking' && !abortedLoginFailurePending;

const setStored = (s: Server, value: Stored) => {
	if (s === 'A') {
		storedA = value;
	} else {
		storedB = value;
	}
};

// selectServer.ts:149 startInsideUnlessSharing.
const startInsideUnlessSharing = () => {
	if (!isSharing(root)) {
		root = 'Inside';
	}
};

const insideUnlessSharing = (r: Root): PutRoot => (isSharing(r) ? 'Skipped' : 'Inside');

// dispatch(selectServerRequest(server)): the reducer sets state.server.server; takeLatest cancels the older task.
const selectServerRequest = (server: Server) => {
	selected = server;
	selectPending = server;
	selectConnected = false;
	selectHadLogin = false;
	selectWasLive = false;
	selectReconnected = false;
	selectPutRoot = 'Skipped';
};

const endSelect = (outcome: Outcome) => {
	lastOutcome = outcome;
	lastServer = selectPending;
	lastHadLogin = selectHadLogin;
	lastWasLive = selectWasLive;
	lastReconnected = selectReconnected;
	lastPutRoot = selectPutRoot;
	lastHost = sdkHost;
	selectPending = null;
	selectConnected = false;
};

// connect.ts:60 connect(): aborts running requests, disconnects, sdk.initialize(server); the socket's 'connected'
// puts loginRequest({ resume }) when state.login.user has a token.
const connect = (server: Server) => {
	if (loginPending !== null) {
		abortedLoginFailurePending = true;
	}
	sdkHost = server;
	loginPending = user === server ? server : null;
};

// deepLinking.js:243 the share extension's race ends without LOGIN.SUCCESS: ROOT_OUTSIDE.
const shareGivesUp = () => {
	if (share === 'Waiting') {
		share = 'GaveUp';
		root = 'Outside';
	}
};

/** init.js:74 restore: CURRENT_SERVER when isLoggedInServer (a stored userId), else findLoggedInServer.
 * @fair */
export const initRestores = () => {
	if (!initPending) return;
	initPending = false;
	if (currentServer !== null && hasUserId(currentServer)) {
		selectServerRequest(currentServer);
		return;
	}
	if (hasUserId('A')) {
		selectServerRequest('A');
		return;
	}
	if (hasUserId('B')) {
		selectServerRequest('B');
		return;
	}
	root = 'Outside';
};

/** selectServer.ts:156 handleSelectServer up to connect(): applyServerCertificate and migrateTokenKeysToServerScoped
 * (neither throws), getStoredSession, the shortcut for the connected workspace, else setUser or clearUser and connect.
 * @fair */
export const selectServerChecks = () => {
	if (selectPending === null || selectConnected) return;
	const server = selectPending;
	selectHadLogin = hasToken(server);
	selectWasLive = sdkHost === server && hasToken(server);
	// selectServer.ts:161, the shortcut.
	if (sdkHost === server && hasToken(server)) {
		selectPutRoot = insideUnlessSharing(root);
		startInsideUnlessSharing();
		endSelect('Cancel');
		return;
	}
	if (hasToken(server)) {
		// selectServer.ts:195: setUser, connect({ logoutOnError: true }), startInsideUnlessSharing, CURRENT_SERVER.
		user = server;
		connect(server);
		selectReconnected = true;
		selectPutRoot = insideUnlessSharing(root);
		startInsideUnlessSharing();
		currentServer = server;
		selectConnected = true;
		return;
	}
	// selectServer.ts:202: clearUser, connect({ server }), appStart(ROOT_OUTSIDE) with no share guard.
	user = null;
	connect(server);
	selectReconnected = true;
	root = 'Outside';
	selectPutRoot = 'Outside';
	selectConnected = true;
};

/** selectServer.ts:173 getLoggedUserById throws before setUser: the catch puts SELECT_FAILURE, then ROOT_OUTSIDE
 * unless the root is ROOT_INSIDE or ROOT_SHARE_EXTENSION. */
export const selectServerFails = () => {
	if (selectPending === null || selectConnected || !hasToken(selectPending)) return;
	if (sdkHost === selectPending) return;
	if (root !== 'Inside' && root !== 'Share') {
		root = 'Outside';
		selectPutRoot = 'Outside';
	}
	endSelect('Failure');
	shareGivesUp();
};

/** selectServer.ts:226 selectServerSuccess.
 * @fair */
export const selectServerFinishes = () => {
	if (selectPending === null || !selectConnected) return;
	endSelect('Success');
};

/** login.js:104 handleLoginRequest answers the resume login with LOGIN.SUCCESS; handleLoginSuccess stores the
 * session and calls startInsideUnlessSharing (login.js:388); the share extension's race takes LOGIN.SUCCESS.
 * @fair */
export const serverAnswersLogin = (succeeded: boolean) => {
	if (loginPending === null || loginPending !== selected) return;
	const server = loginPending;
	loginPending = null;
	if (!succeeded) {
		shareGivesUp();
		return;
	}
	user = server;
	setStored(server, 'SignedIn');
	currentServer = server;
	if (share === 'Waiting') {
		share = 'Shown';
		root = 'Share';
		return;
	}
	startInsideUnlessSharing();
};

/** login.js:172 the login connect() aborted rejects and handleLoginRequest puts LOGIN.FAILURE.
 * @fair */
export const abortedLoginFails = () => {
	if (!abortedLoginFailurePending) return;
	abortedLoginFailurePending = false;
	shareGivesUp();
};

/** ServersList.tsx:62 navToNewServer: Add workspace puts ROOT_OUTSIDE and serverInitAdd(current workspace). */
export const userTapsAddWorkspace = () => {
	if (root !== 'Inside' || !userCanTap()) return;
	root = 'Outside';
	previousServer = selected;
};

/** NewServerView Connect (disabled while state.server.connecting) → selectServer.ts:250 handleServerRequest probes the
 * server, navigates to the workspace screen and puts selectServerRequest. */
export const userTapsConnect = (server: Server) => {
	if (root !== 'Outside' || !userCanTap()) return;
	selectServerRequest(server);
};

/** NewServerView/index.tsx:94 close: selectServerRequest(previousServer). */
export const userClosesAddWorkspace = () => {
	if (root !== 'Outside' || previousServer === null || !userCanTap()) return;
	selectServerRequest(previousServer);
};

/** ServersList.tsx:77 select: a workspace with a stored userId is selected; one without opens Add workspace, whose
 * NewServer event puts serverRequest for it. */
export const userSwitchesWorkspace = (server: Server) => {
	if (root !== 'Inside' || !userCanTap() || server === selected) return;
	if (!hasUserId(server)) {
		root = 'Outside';
		previousServer = selected;
	}
	selectServerRequest(server);
};

/** LoginView on the workspace screen: the password login puts LOGIN.SUCCESS; handleLoginSuccess stores the session
 * under state.server.server and starts inside. */
export const userSignsIn = () => {
	if (root !== 'Outside' || !userCanTap() || loginPending !== null) return;
	if (selected === null || sdkHost !== selected || user !== null) return;
	user = selected;
	setStored(selected, 'SignedIn');
	currentServer = selected;
	startInsideUnlessSharing();
};

/** login.js:400 handleLogout: LOGOUT clears state.login and ends a waiting share extension (its ROOT_OUTSIDE and
 * handleLogout's ROOT_LOADING race; the model keeps ROOT_LOADING); then ROOT_LOADING. */
export const userLogsOut = () => {
	if (root !== 'Inside' || !userCanTap() || selected === null) return;
	logoutPending = true;
	logoutServer = selected;
	user = null;
	loginPending = null;
	if (share === 'Waiting') {
		share = 'GaveUp';
	}
	root = 'Loading';
};

/** login.js:406 logoutCall disconnects and removes the session and CURRENT_SERVER; then selects findLoggedInServer
 * (a stored userId, login.js:423) or puts ROOT_OUTSIDE.
 * @fair */
export const logoutFinishes = () => {
	if (!logoutPending || logoutServer === null) return;
	logoutPending = false;
	sdkHost = null;
	setStored(logoutServer, 'None');
	logoutServer = null;
	currentServer = null;
	if (hasUserId('A')) {
		selectServerRequest('A');
		return;
	}
	if (hasUserId('B')) {
		selectServerRequest('B');
		return;
	}
	root = 'Outside';
};

/** deepLinking.js:213 handleShareExtension: another app shares into Rocket.Chat while it runs (also while logging out).
 * No stored userId for CURRENT_SERVER: appInit(); else ROOT_LOADING_SHARE_EXTENSION, then localAuthenticate. */
export const userSharesIntoApp = () => {
	if (share !== 'Idle' || initPending || (root !== 'Inside' && root !== 'Outside' && !logoutPending)) return;
	if (currentServer === null || !hasUserId(currentServer)) {
		share = 'GaveUp';
		initPending = true;
		return;
	}
	share = 'Unlocking';
	shareServer = currentServer;
	root = 'LoadingShare';
};

/** deepLinking.js:241 after the unlock: selectServerRequest(CURRENT_SERVER); with sdk.host already on it, puts
 * ROOT_SHARE_EXTENSION at once (:242, :255), else waits for LOGIN.SUCCESS, LOGIN.FAILURE, SELECT_FAILURE or LOGOUT.
 * @fair */
export const shareUnlocks = () => {
	if (share !== 'Unlocking' || shareServer === null) return;
	selectServerRequest(shareServer);
	if (sdkHost === shareServer) {
		share = 'Shown';
		root = 'Share';
		return;
	}
	share = 'Waiting';
};

/** ShareListView/index.tsx:392 and ShareView/index.tsx:309: leaving the share screen puts ROOT_INSIDE. */
export const userLeavesShare = () => {
	if (root !== 'Share' || !userCanTap()) return;
	root = 'Inside';
};

/** Selecting the connected workspace that has a stored login opens its rooms list without reconnecting. */
export const liveWorkspaceOpensWithoutReconnect = () =>
	lastOutcome === 'None' || !lastWasLive || (lastOutcome === 'Cancel' && !lastReconnected && lastPutRoot !== 'Outside');

/** Selecting a workspace without a stored login ends on the workspace screen, connected to that workspace. */
export const loginlessSelectEndsOnWorkspaceScreen = () =>
	lastOutcome === 'None' || lastOutcome === 'Failure' || lastHadLogin || (lastPutRoot === 'Outside' && lastHost === lastServer);

/** Every workspace selection ends with success, cancel or failure.
 * @leadsTo noSelectPending */
export const selectPendingNow = () => selectPending !== null;

const noSelectPending = () => selectPending === null;

/** The app never stays on the splash or a loading screen forever.
 * @leadsTo offLoadingRoot */
export const onLoadingRoot = () => root === 'Loading' || root === 'LoadingShare';

const offLoadingRoot = () => root !== 'Loading' && root !== 'LoadingShare';
