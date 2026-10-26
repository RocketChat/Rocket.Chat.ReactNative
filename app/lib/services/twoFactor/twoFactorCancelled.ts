export class TwoFactorCancelledError extends Error {
	constructor() {
		super('Two-factor authentication was cancelled');
		this.name = 'TwoFactorCancelledError';
	}
}

export const isTwoFactorCancelled = (e: unknown): e is TwoFactorCancelledError =>
	e instanceof TwoFactorCancelledError || (e instanceof Error && e.name === 'TwoFactorCancelledError');
