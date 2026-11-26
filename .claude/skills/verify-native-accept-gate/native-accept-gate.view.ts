type Vars = Record<string, any>;

export const title = 'Native accept gate';

const activeOnServer = (vars: Vars): string[] => Object.values(vars.serverSubs ?? {}) as string[];

const callState = (vars: Vars) => {
	switch (vars.gate) {
		case 'recovering':
			return 'Accept tapped, recovering the socket';
		case 'answered':
			return vars.answeredLive ? 'Answered' : 'Answered on a dead subscription';
		case 'failed':
			return 'Call ended by the app';
		default:
			return vars.deadlinePassed ? 'Gate deadline passed' : 'Waiting for login and media subscriptions';
	}
};

const socketState = (vars: Vars) => {
	if (vars.link === 'down') return 'Socket down';
	if (vars.login === 'done' && vars.loginReady) return 'Logged in';
	return 'Socket open, resume login pending';
};

const mediaSubsState = (vars: Vars) => {
	const active = activeOnServer(vars).length;
	if (active === 2) return 'Both media subs active';
	if (active === 0) return 'No media sub active';
	return 'One media sub active';
};

export const state = (vars: Vars) => ({
	Call: callState(vars),
	Socket: socketState(vars),
	'Server media subs': mediaSubsState(vars)
});

export const step = (action: string, from: Vars, to: Vars) => {
	const name = action.replace(/\(.*$/, '');
	switch (name) {
		case 'RecoverSocket':
			return from.link === to.link && from.gen === to.gen
				? 'the probe confirms the socket is alive'
				: 'recoverSocket reopens the socket';
		case 'SendSubscription':
			return from.link === 'down' ? 'the SDK keeps the record while offline' : 'the SDK sends a media sub';
		case 'SendLogin':
			return 'the app sends the resume login';
		case 'AppLogsInAgain':
			return 'the app logs in again on the live socket';
		case 'ServerHandlesLogin': {
			const replies = Object.values(to.toClient ?? {}) as { msg: string }[];
			return replies.some(frame => frame.msg === 'ready')
				? 'the server logs in again and re-sends ready for its active subs in one frame'
				: 'the server logs the connection in';
		}
		case 'ServerHandlesSub': {
			const replies = Object.values(to.toClient ?? {}) as { msg: string }[];
			const before = Object.values(from.toClient ?? {}).length;
			if (replies.length === before) return 'the server ignores a sub whose id is active';
			return replies[replies.length - 1].msg === 'nosubError'
				? 'the server rejects the sub before login'
				: 'the server activates the sub and sends ready';
		}
		case 'ReceiveLoginResult':
			return 'the login result arrives and the SDK resubscribes';
		case 'ReceiveReady': {
			const frame = (Object.values(from.toClient ?? {}) as { also: string }[])[0];
			return frame && frame.also !== 'Null' ? 'a batched ready arrives' : 'ready arrives';
		}
		case 'ReceiveNosubError':
			return 'nosub arrives and the SDK forgets the subscription';
		case 'LoginSuccess':
			return 'the app marks the login ready';
		case 'MediaSubsWaitSettles':
			return to.mediaSubsWait === 'true' ? 'the media-subs wait resolves true' : 'the media-subs wait resolves false';
		case 'AcceptDecides':
			return to.gate === 'answered' ? 'the app answers the call' : 'handleFailure ends the call';
		case 'TransportLost':
			return 'the transport closes';
		case 'Reopen':
			return 'the SDK reopens the socket';
		case 'GateDeadline':
			return 'the 8s gate deadline fires';
		case 'ExpiredWait':
			return "the SDK's 10s sub wait expires";
		default:
			return name;
	}
};
