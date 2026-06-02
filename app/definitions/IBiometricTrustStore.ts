export type TrustResult =
	| { kind: 'success' }
	| { kind: 'canceled' }
	| { kind: 'enrollmentChanged' }
	| { kind: 'unavailable' }
	| { kind: 'error'; cause: unknown };

export interface IBiometricTrustStore {
	enrol(): Promise<TrustResult>;
	disenrol(): Promise<void>;
	verify(opts: { promptCopy: { title: string; cancel: string } }): Promise<TrustResult>;
	probeExists(): Promise<boolean>;
}
