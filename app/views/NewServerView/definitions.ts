export interface ISubmitParams {
	fromServerHistory?: boolean;
	username?: string;
	serverUrl?: string;
}

export interface TCertificatePicker {
	connecting: boolean;
	showBottomInfo: boolean;
	previousServer: string | null;
	certificate: string | null;
	handleRemove: () => void;
	chooseCertificate: () => Promise<void>;
}
