/** @noDeadlock */
import { LATE_READY, MAX_DROPS, RELOGIN, SERVER, SOCKET } from './scenario';

type Sub = 'media-signal' | 'media-calls';
type RequestOrigin = 'app' | 'gate' | 'subscribeAll';
type ToServerFrame = { msg: 'sub' | 'login'; sub: Sub | null; origin: RequestOrigin | 'app' };
type ToClientFrame = { msg: 'loginResult' | 'ready' | 'nosubError'; sub: Sub | null; also: Sub | null };

let link: 'open' | 'down' = 'open';
let gen = 1;
let drops = 0;
let serverSubs = new Set<Sub>(RELOGIN ? [] : ['media-signal', 'media-calls']);
let serverUser = true;
let toServer: ToServerFrame[] = [];
let toClient: ToClientFrame[] = LATE_READY ? [{ msg: 'ready', sub: 'media-signal', also: null }] : [];

let records = new Set<Sub>(RELOGIN ? [] : ['media-signal', 'media-calls']);
let queue = new Map<Sub, RequestOrigin[]>([
	['media-signal', RELOGIN ? ['app'] : []],
	['media-calls', RELOGIN ? ['app'] : []]
]);
let inFlight = new Map<Sub, boolean>([
	['media-signal', false],
	['media-calls', false]
]);

let login: 'none' | 'pending' | 'sent' | 'done' = 'done';
let loginReady = true;

let loginWait: 'pending' | 'true' | 'false' = 'pending';
let gate: 'recovering' | 'waiting' | 'answered' | 'failed' = 'recovering';
let mediaSubsWait: 'idle' | 'sent' | 'true' | 'false' = 'idle';
let readyOnGen = new Map<Sub, number>([
	['media-signal', LATE_READY || RELOGIN ? 0 : 1],
	['media-calls', RELOGIN ? 0 : 1]
]);

let reloginSent = false;

let answeredLive = false;
let gateSentDuplicate = false;
let deadlinePassed = false;

const canMediaSubsWaitSettle = () =>
	gate === 'waiting' &&
	mediaSubsWait === 'idle' &&
	link === 'open' &&
	records.size === 2 &&
	readyOnGen.get('media-signal')! === gen &&
	readyOnGen.get('media-calls')! === gen;

const canAcceptDecide = () =>
	gate === 'waiting' && (mediaSubsWait === 'true' || mediaSubsWait === 'false') && loginWait !== 'pending';

const noMicrotaskPending = () => !canMediaSubsWaitSettle() && !canAcceptDecide();

const canSendSubscription = (sub: Sub) => queue.get(sub)!.length > 0 && !inFlight.get(sub)!;

const canSendLogin = () => login === 'pending' && link === 'open';

const canLoginSucceed = () => login === 'done' && !loginReady && link === 'open';

const liveNow = () => link === 'open' && serverUser && serverSubs.has('media-signal') && serverSubs.has('media-calls');

const quiet = () =>
	toServer.length === 0 &&
	toClient.length === 0 &&
	link === 'open' &&
	!canSendLogin() &&
	!canLoginSucceed() &&
	!canSendSubscription('media-signal') &&
	!canSendSubscription('media-calls');

const ignoredByServer = (sub: Sub) =>
	inFlight.get(sub)! &&
	toServer.every(frame => frame.sub !== sub) &&
	toClient.every(frame => frame.sub !== sub && frame.also !== sub);

const otherSub = (sub: Sub): Sub => (sub === 'media-signal' ? 'media-calls' : 'media-signal');

const abandonWrittenRequest = (sub: Sub) => {
	if (inFlight.get(sub)!) {
		queue.get(sub)!.shift();
		inFlight.set(sub, false);
		records.add(sub);
	}
};

const openConnection = () => {
	link = 'open';
	gen += 1;
	serverSubs = new Set<Sub>();
	serverUser = false;
	toServer = [];
	toClient = [];
	login = 'pending';
	loginReady = false;
};

const settleHead = (sub: Sub) => {
	queue.get(sub)!.shift();
	inFlight.set(sub, false);
};

export const RecoverSocket = () => {
	if (gate !== 'recovering') return;
	gate = 'waiting';
	if (SOCKET === 'alive') {
		loginWait = loginReady ? 'true' : 'pending';
	} else {
		openConnection();
		abandonWrittenRequest('media-signal');
		abandonWrittenRequest('media-calls');
		loginWait = 'pending';
	}
};

export const SendSubscription = (sub: Sub) => {
	if (!noMicrotaskPending()) return;
	if (!canSendSubscription(sub)) return;
	if (link === 'down') {
		queue.get(sub)!.shift();
		records.add(sub);
	} else {
		toServer.push({ msg: 'sub', sub, origin: queue.get(sub)![0] });
		inFlight.set(sub, true);
	}
};

export const SendLogin = () => {
	if (!noMicrotaskPending()) return;
	if (!canSendLogin()) return;
	toServer.push({ msg: 'login', sub: null, origin: 'app' });
	login = 'sent';
};

export const AppLogsInAgain = () => {
	if (!noMicrotaskPending()) return;
	if (!RELOGIN || reloginSent) return;
	if (link !== 'open' || login !== 'done' || !loginReady) return;
	toServer.push({ msg: 'login', sub: null, origin: 'app' });
	login = 'sent';
	reloginSent = true;
};

export const ServerHandlesLogin = (first: Sub) => {
	if (toServer.length === 0 || toServer[0].msg !== 'login') return;
	const rerunsSubs = SERVER === 'monolith' && serverSubs.size > 0;
	if (rerunsSubs && !serverSubs.has(first)) return;
	toServer.shift();
	serverUser = true;
	if (rerunsSubs) {
		toClient.push({ msg: 'ready', sub: first, also: serverSubs.has(otherSub(first)) ? otherSub(first) : null });
	}
	toClient.push({ msg: 'loginResult', sub: null, also: null });
};

export const ServerHandlesSub = () => {
	if (toServer.length === 0 || toServer[0].msg !== 'sub') return;
	const request = toServer.shift()!;
	const sub = request.sub!;
	if (request.origin === 'gate' && serverSubs.has(sub)) gateSentDuplicate = true;
	if (!serverUser) {
		toClient.push({ msg: 'nosubError', sub, also: null });
	} else if (!(serverSubs.has(sub) && SERVER === 'monolith')) {
		serverSubs.add(sub);
		toClient.push({ msg: 'ready', sub, also: null });
	}
};

export const ReceiveLoginResult = () => {
	if (!noMicrotaskPending()) return;
	if (toClient.length === 0 || toClient[0].msg !== 'loginResult') return;
	toClient.shift();
	login = 'done';
	if (records.has('media-signal')) queue.get('media-signal')!.push('subscribeAll');
	if (records.has('media-calls')) queue.get('media-calls')!.push('subscribeAll');
};

export const ReceiveReady = () => {
	if (!noMicrotaskPending()) return;
	if (toClient.length === 0 || toClient[0].msg !== 'ready') return;
	const frame = toClient.shift()!;
	const sub = frame.sub!;
	if (frame.also !== null && inFlight.get(frame.also!)!) {
		settleHead(frame.also!);
		records.add(frame.also!);
	}
	if (frame.also !== null) readyOnGen.set(frame.also!, gen);
	if (inFlight.get(sub)!) {
		settleHead(sub);
		records.add(sub);
	}
	readyOnGen.set(sub, gen);
};

export const ReceiveNosubError = () => {
	if (!noMicrotaskPending()) return;
	if (toClient.length === 0 || toClient[0].msg !== 'nosubError') return;
	const frame = toClient.shift()!;
	const sub = frame.sub!;
	settleHead(sub);
	records.delete(sub);
	readyOnGen.set(sub, 0);
};

export const LoginSuccess = () => {
	if (!noMicrotaskPending()) return;
	if (!canLoginSucceed()) return;
	loginReady = true;
	if (gate === 'waiting') loginWait = 'true';
};

export const MediaSubsWaitSettles = () => {
	if (!canMediaSubsWaitSettle()) return;
	mediaSubsWait = 'true';
};

export const AcceptDecides = () => {
	if (canMediaSubsWaitSettle()) return;
	if (!canAcceptDecide()) return;
	if (mediaSubsWait === 'true' && loginWait === 'true') {
		gate = 'answered';
		answeredLive = liveNow();
	} else {
		gate = 'failed';
	}
};

export const TransportLost = () => {
	if (!noMicrotaskPending()) return;
	if (drops >= MAX_DROPS || link !== 'open' || gate !== 'waiting') return;
	link = 'down';
	drops += 1;
	toServer = [];
	toClient = [];
	serverSubs = new Set<Sub>();
	serverUser = false;
	login = 'none';
	loginReady = false;
	abandonWrittenRequest('media-signal');
	abandonWrittenRequest('media-calls');
};

export const Reopen = () => {
	if (!noMicrotaskPending()) return;
	if (link !== 'down') return;
	openConnection();
};

export const GateDeadline = () => {
	if (gate !== 'waiting' || !quiet()) return;
	if (!noMicrotaskPending() || deadlinePassed) return;
	deadlinePassed = true;
	if (mediaSubsWait === 'idle' || mediaSubsWait === 'sent') mediaSubsWait = 'false';
	if (loginWait === 'pending') loginWait = 'false';
};

export const ExpiredWait = (sub: Sub) => {
	if (!noMicrotaskPending()) return;
	if (!ignoredByServer(sub)) return;
	settleHead(sub);
	records.add(sub);
};

/** A native accept never ends the call while the server answers every request in time. */
export const AcceptConnects = () => gate !== 'failed';

/** The app answers only while the socket is open, logged in, and both media subscriptions are active on the server. */
export const AnswerOnlyWhenLive = () => gate !== 'answered' || answeredLive;

/** The accept gate never sends a sub whose id is already active on the connection. */
export const GateSendsNoDuplicateSub = () => !gateSentDuplicate;

const settled = () =>
	(gate === 'answered' || gate === 'failed') && quiet() && !inFlight.get('media-signal')! && !inFlight.get('media-calls')!;

/** Once everything settles, both media subscriptions are still recorded by the SDK and active on the server. */
export const MediaSubsSurviveAccept = () =>
	!settled() || (records.size === 2 && serverSubs.has('media-signal') && serverSubs.has('media-calls'));

/** The app answers only on a positive result from both waits, never because the 8s deadline passed. */
export const AnswerBeforeDeadline = () => gate !== 'answered' || !deadlinePassed;

/** Witness, expected to break: a break proves some path answers the call. */
export const NeverAnswers = () => gate !== 'answered';
