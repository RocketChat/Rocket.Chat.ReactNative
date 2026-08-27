import { isTwoFactorCancelled } from './twoFactorCancelled';

export type TwoFactorOutcome<T> = { status: 'completed'; value: T } | { status: 'cancelled' };

export const runCancellableAction = async <T>(action: () => Promise<T>): Promise<TwoFactorOutcome<T>> => {
	try {
		return { status: 'completed', value: await action() };
	} catch (e) {
		if (isTwoFactorCancelled(e)) {
			return { status: 'cancelled' };
		}
		throw e;
	}
};
