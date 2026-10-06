const CAP = 100;

export const actionBuffer = () => (_store: any) => (next: any) => (action: any) => {
	(global as any).__reduxActions ??= [];
	const buf = (global as any).__reduxActions;
	buf.push({ type: action.type, t: Date.now() });
	if (buf.length > CAP) buf.shift();
	return next(action);
};
