import { useState } from 'react';

import I18n from '~/i18n';
import { showConfirmationAlert } from '~/lib/methods/helpers/info';
import SSLPinning, { applyServerCertificate } from '~/lib/methods/helpers/sslPinning';

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

	const autocompleteCertificate = async (server: string) => {
		const certificate = await applyServerCertificate(server);
		if (certificate) {
			setCertificate(certificate);
		}
	};

	const removeCertificate = (server: string) => {
		showConfirmationAlert({
			message: I18n.t('You_will_unset_a_certificate_for_this_server'),
			confirmationText: I18n.t('Remove'),
			onPress: () => {
				SSLPinning?.removeCertificate(server);
				setCertificate(null);
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
