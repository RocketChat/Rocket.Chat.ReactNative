// Model of E2EE key distribution runs in app/lib/encryption/encryption.ts against sign-in, reconnect and stop.
// Every action names the code it stands for; see ../SKILL.md for the coverage table.

type User = 'U1' | 'U2';
// The awaits inside one keyDistribution() call: subscriptions query, one getSample pass (its handshakes run together),
// fetchUsersWaitingForGroupKey, getSuggestedE2EEKeys (handshakes and encryptGroupKeyForParticipantsWaitingForTheKeys),
// provideUsersSuggestedGroupKeys.
type Step = 'Query' | 'Handshake' | 'Fetching' | 'Encrypting' | 'Providing';

type Run = {
	// The setInterval handle of the initiateKeyDistribution call that owns this run's closure.
	handle: number;
	step: Step;
	// getSample passes left: the first call, and a retry with a smaller limit when the first finds no room with a session key.
	roomsLeft: number;
	// A getSample pass found at least one room with a session key.
	found: boolean;
};

// Encryption.userId: null after stop(); set by initialize().
let userId: User | null = null;
// The user an ENCRYPTION.INIT saga is starting the client for, before it reaches initialize().
let initPendingFor: User | null = null;
// Encryption.keyDistributionInterval: 0 stands for null. setInterval never hands out a handle twice.
let keyDistributionInterval = 0;
let nextHandle = 1;
// Each initiateKeyDistribution closure's `distributing` flag, indexed by flagOf(handle).
let distributing: boolean[] = [false, false, false];
// Encryption.roomInstances holds at least one EncryptionRoom.
let hasRoomInstances = false;
// keyDistribution() calls in flight: at most one per handle, so a handle names its run.
let runs: Run[] = [];

// What a run left over from an earlier session did after its session ended.
let staleRoomHandshake = false;
let staleWaitingUsersFetch = false;
let staleKeyProvide = false;
// A keyDistribution() call returned early on `distributing` while no run of its own closure was in flight.
let skippedByOtherSession = false;

// Two sign-ins: enough for a run of the first session to overlap the second.
const MAX_SESSIONS = 2;

// `distributing` is a local of each initiateKeyDistribution call, so each handle has its own flag.
const flagOf = (handle: number) => handle;

// The rules' own record of a run whose session ended, kept apart from any stale check the code adds, so a broken check cannot hide its effects.
const sessionEnded = (run: Run) => keyDistributionInterval !== run.handle;

const replaceRun = (index: number, run: Run) => {
	runs = runs.with(index, run);
};

// The `finally` of keyDistribution(): clear the closure's flag and leave.
const finish = (index: number) => {
	const handle = runs[index].handle;
	distributing = distributing.with(flagOf(handle), false);
	runs = runs.filter(r => r.handle !== handle);
};

// getRoomInstance(): creates the EncryptionRoom when missing, then starts its handshake.
const startHandshake = (run: Run) => {
	if (sessionEnded(run)) {
		staleRoomHandshake = true;
	}
	hasRoomInstances = true;
};

// keyDistribution() after `await this.getSample(...)`: `if (!sampleIds.length) return;`, then fetchUsersWaitingForGroupKey.
const afterSample = (index: number, run: Run) => {
	if (!run.found) {
		finish(index);
		return;
	}
	if (sessionEnded(run)) {
		staleWaitingUsersFetch = true;
	}
	replaceRun(index, { ...run, step: 'Fetching' });
};

// getSample's top: `if (limit === 0) return [];`, then every sampled room's getRoomInstance starts in the same tick
// and `await Promise.all(...)` waits for all their handshakes. A pass that finds no room retries with a smaller limit.
const sampleNext = (index: number, run: Run) => {
	if (run.roomsLeft === 0 || run.found) {
		afterSample(index, run);
		return;
	}
	startHandshake(run);
	replaceRun(index, { ...run, step: 'Handshake', roomsLeft: run.roomsLeft - 1 });
};

// keyDistribution(): `if (distributing) return; distributing = true;`, then query the subscriptions.
const keyDistribution = (handle: number) => {
	if (distributing[flagOf(handle)]) {
		if (!runs.some(r => r.handle === handle)) {
			skippedByOtherSession = true;
		}
		return;
	}
	distributing = distributing.with(flagOf(handle), true);
	runs.push({ handle, step: 'Query', roomsLeft: 0, found: false });
};

/** login.js handleLoginSuccess puts ENCRYPTION.INIT: handleEncryptionInit starts and awaits server info, keys and persistKeys or createKeys before it calls initialize. */
export const signIn = (user: User) => {
	if (userId !== null || initPendingFor !== null || nextHandle > MAX_SESSIONS) return;
	initPendingFor = user;
};

/** login.js handleLoginSuccess on a reconnect puts ENCRYPTION.INIT again for the signed-in user; takeLatest restarts the saga. */
export const reconnect = () => {
	if (userId === null || initPendingFor !== null) return;
	initPendingFor = userId;
};

/** handleEncryptionInit (or handleEncryptionDecodeKey after the password is entered) reaches Encryption.initialize(userId): set userId, clear roomInstances, and initiateKeyDistribution() starts the interval and runs once unless one is live. */
export const initializeRuns = () => {
	if (initPendingFor === null) return;
	userId = initPendingFor;
	initPendingFor = null;
	hasRoomInstances = false;
	if (keyDistributionInterval !== 0) return;
	const handle = nextHandle;
	nextHandle += 1;
	keyDistributionInterval = handle;
	keyDistribution(handle);
};

/** sagas/encryption.js handleEncryptionStop → Encryption.stop() (logout, workspace switch, account deletion): clear userId and roomInstances, clearInterval, keyDistributionInterval = null. A pending init is dropped here, although nothing in the code cancels it; encryptionInit.ts covers that case. */
export const stop = () => {
	if (userId === null && initPendingFor === null) return;
	userId = null;
	initPendingFor = null;
	hasRoomInstances = false;
	keyDistributionInterval = 0;
};

/** The live interval fires keyDistribution() every KEY_DISTRIBUTION_INTERVAL; a cleared interval never fires. */
export const intervalFires = () => {
	if (keyDistributionInterval === 0) return;
	keyDistribution(keyDistributionInterval);
};

/** The subscriptions query resolves; getSample gets no room (0), rooms for one pass (1), or more rooms than the limit, so a pass that finds none retries (2). */
export const queryResolves = (index: 0 | 1, waitingRooms: 0 | 1 | 2) => {
	if (index >= runs.length || runs[index].step !== 'Query') return;
	sampleNext(index, { ...runs[index], roomsLeft: waitingRooms });
};

/** getSample's Promise.all of handshakes resolves; at least one sampled room has a session key or none does. */
export const sampleHandshakeResolves = (index: 0 | 1, hasSessionKey: boolean) => {
	if (index >= runs.length || runs[index].step !== 'Handshake') return;
	const run = runs[index];
	sampleNext(index, { ...run, found: run.found || hasSessionKey });
};

/** fetchUsersWaitingForGroupKey resolves: `if (!result.success || !usersWaiting.length) return;`, then getSuggestedE2EEKeys starts a handshake for each room. */
export const waitingUsersResolve = (index: 0 | 1, anyoneWaiting: boolean) => {
	if (index >= runs.length || runs[index].step !== 'Fetching') return;
	const run = runs[index];
	if (!anyoneWaiting) {
		finish(index);
		return;
	}
	startHandshake(run);
	replaceRun(index, { ...run, step: 'Encrypting' });
};

/** getSuggestedE2EEKeys resolves: `if (!Object.keys(userKeysWithRooms).length) return;`, then provideUsersSuggestedGroupKeys. */
export const suggestedKeysResolve = (index: 0 | 1, anyKeys: boolean) => {
	if (index >= runs.length || runs[index].step !== 'Encrypting') return;
	const run = runs[index];
	if (!anyKeys) {
		finish(index);
		return;
	}
	if (sessionEnded(run)) {
		staleKeyProvide = true;
	}
	replaceRun(index, { ...run, step: 'Providing' });
};

/** provideUsersSuggestedGroupKeys resolves; the run ends. */
export const provideResolves = (index: 0 | 1) => {
	if (index >= runs.length || runs[index].step !== 'Providing') return;
	finish(index);
};

/** After a stop, no run left over from the ended session starts a room handshake. */
export const noStaleRoomHandshake = () => !staleRoomHandshake;

/** After a stop, no run left over from the ended session asks the server which users wait for room keys. */
export const noStaleWaitingUsersFetch = () => !staleWaitingUsersFetch;

/** After a stop, no run left over from the ended session sends suggested room keys to the server. */
export const noStaleKeyProvide = () => !staleKeyProvide;

/** While the client is stopped, it holds no room instances. */
export const stoppedHoldsNoRooms = () => userId !== null || !hasRoomInstances;

/** A session's key distribution never skips a run because a run from an earlier session is still in flight. */
export const noSkipByOtherSession = () => !skippedByOtherSession;

/** @terminating */
export const settled = () => runs.length === 0;
