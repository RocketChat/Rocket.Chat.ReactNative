export const title = 'E2EE key distribution across sign-in and stop';

const runsOf = (vars: any) => Object.values(vars.runs ?? {}) as any[];

export const state = (vars: any) => {
	const runs = runsOf(vars);
	const current = runs.some(r => r.handle === vars.keyDistributionInterval);
	const leftover = runs.some(r => r.handle !== vars.keyDistributionInterval);
	let runsLabel = 'No run in flight';
	if (current && leftover) runsLabel = "This session's run and a leftover run";
	else if (current) runsLabel = "This session's run";
	else if (leftover) runsLabel = 'Leftover run from an ended session';
	return { Client: vars.userId === 'Null' ? 'Stopped' : 'Signed in', Runs: runsLabel };
};

const labels: Record<string, string> = {
	signIn: 'you sign in (init starts)',
	reconnect: 'the app reconnects',
	initializeRuns: 'the client starts',
	stop: 'you log out or switch workspace',
	intervalFires: 'the interval fires'
};

export const step = (action: string, from: any, to: any) => {
	if (runsOf(to).length < runsOf(from).length) return 'a run ends';
	const name = action.split('(')[0];
	return labels[name] ?? 'a run moves to its next await';
};
