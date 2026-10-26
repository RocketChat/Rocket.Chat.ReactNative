import { useState } from 'react';

import I18n from '~/i18n';
import { showConfirmationAlert } from '~/lib/methods/helpers/info';
import SSLPinning, { getServerCertificate } from '~/lib/methods/helpers/sslPinning';
import log from '~/lib/methods/helpers/log';

const useCertificate = () => {
	const [certificate, setCertificate] = useState<string | null>(null);

	const chooseCertificate = async (server: string) => {
		try {
			const certificate = await SSLPinning?.pickCertificate(server);
			setCertificate(certificate);
		} catch {
			// Do nothing
		}
	};

	const autocompleteCertificate = (server: string) => {
		const certificate = getServerCertificate(server);
		if (certificate) {
			setCertificate(certificate);
		}
	};

	const removeCertificate = (server: string) => {
		showConfirmationAlert({
			message: I18n.t('You_will_unset_a_certificate_for_this_server'),
			confirmationText: I18n.t('Remove'),
			onPress: async () => {
				try {
					await SSLPinning?.removeCertificate(server);
					setCertificate(null);
				} catch (e) {
					log(e);
				}
			}
		});
	};

	return {
		certificate,
		chooseCertificate,
		autocompleteCertificate,
		removeCertificate
	};
};

export default useCertificate;
