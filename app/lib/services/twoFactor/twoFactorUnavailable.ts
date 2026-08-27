export class TwoFactorUnavailableError extends Error {
	constructor() {
		super('Two-factor authentication prompt is unavailable');
		this.name = 'TwoFactorUnavailableError';
	}
}

export const isTwoFactorUnavailable = (e: unknown): e is TwoFactorUnavailableError =>
	e instanceof TwoFactorUnavailableError || (e instanceof Error && e.name === 'TwoFactorUnavailableError');
