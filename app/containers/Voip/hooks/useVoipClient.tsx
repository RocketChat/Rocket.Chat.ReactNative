// import { useUser, useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
// import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

// import VoipClient from '../lib/VoipClient';
import { useWebRtcServers } from './useWebRtcServers';
import VoipClient from '../../../lib/voip/VoipClient';
import { store } from '../../../lib/store/auxStore';
import { Services } from '../../../lib/services';

type VoipClientParams = {
	enabled?: boolean;
	autoRegister?: boolean;
};

type VoipClientResult = {
	voipClient: VoipClient | null;
	error: Error | null;
};

export const useVoipClient = ({ enabled = true, autoRegister = true }: VoipClientParams = {}): VoipClientResult => {
	const [data, setData] = useState<VoipClientResult>({ voipClient: null, error: null });
	const voipClientRef = useRef<VoipClient | null>(null);

	const userId = store.getState().login.user.id as string;
	const iceServers = useWebRtcServers();

	useEffect(() => {
		if (voipClientRef.current) {
			voipClientRef.current.clear();
		}

		if (!enabled) {
			return;
		}

		if (!userId) {
			setData({ voipClient: null, error: new Error('error-user-not-found') });
		}

		Services.getRegistrationInfo({ userId })
			.then(registration => {
				if (!registration.success) {
					throw Error('error-registration-not-found');
				}

				const {
					extension: { extension },
					credentials: { websocketPath, password }
				} = registration;

				const url = new URL(websocketPath);

				const config = {
					iceServers,
					authUserName: extension,
					authPassword: password,
					sipRegistrarHostnameOrIP: url.host,
					webSocketURI: websocketPath,
					connectionRetryCount: Number(10), // TODO: get from settings
					enableKeepAliveUsingOptionsForUnstableNetworks: true // TODO: get from settings
				};

				VoipClient.create(config).then(voipClient => {
					if (autoRegister) {
						voipClient.register();
					}

					setData({ voipClient, error: null });
				});
			})
			.catch(e => {
				setData({ voipClient: null, error: new Error(e.error || 'error-registration-not-found') });
			});
	}, [autoRegister, enabled, iceServers, userId]);

	useEffect(() => {
		voipClientRef.current = data.voipClient;

		return () => voipClientRef.current?.clear();
	}, [data.voipClient]);

	return data;
};
