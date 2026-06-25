export const logger = (store: any) => (next: any) => (action: any) => {
	console.group(action.type);
	console.info('dispatching', action);
	const result = next(action);
	console.log('next state', store.getState());
	console.groupEnd();
	return result;
};
