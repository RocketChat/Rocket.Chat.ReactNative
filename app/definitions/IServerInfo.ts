type Dictionary = {
	[lng: string]: Record<string, string>;
};

type Messages = {
	remainingDays: number;
	message: 'message_token';
	type: 'info' | 'alert' | 'error';
	params?: Record<string, unknown>;
};

type Version = {
	version: string;
	expiration: string; // Date;
	messages?: Messages[];
};

// TODO: used on mock only. Remove before merge.
export interface ISupportedVersions {
	timestamp: string;
	messages?: Messages[];
	versions: Version[];
	exceptions?: {
		domain: string;
		uniqueId: string;
		messages?: Messages[];
		versions: Version[];
	};
	i18n?: Dictionary;
}

export interface IServerInfo {
	version: string;
	success: boolean;
	supportedVersions?: ISupportedVersions; // SerializedJWT<ISupportedVersions>;
	minimumClientVersions?: {
		desktop: string;
		mobile: string;
	};
}

export interface ICloudInfo {
	signed: ISupportedVersions; // SerializedJWT<SupportedVersions>
	timestamp: string;
	messages?: Messages[];
	versions: Version[];
	exceptions?: {
		domain: string;
		uniqueId: string;
		messages?: Messages[];
		versions: Version[];
	};
}
