import { FreeSwitchExtension } from '../../../lib/voip/definitions/FreeSwitchExtension';

export type VoipFreeSwitchExtensionGetInfoProps = {
	userId: string;
};

export type VoipFreeSwitchEndpoints = {
	'voip-freeswitch.extension.getRegistrationInfoByUserId': {
		GET: (params: VoipFreeSwitchExtensionGetInfoProps) => {
			extension: FreeSwitchExtension;
			credentials: { password: string; websocketPath: string };
		};
	};
};
