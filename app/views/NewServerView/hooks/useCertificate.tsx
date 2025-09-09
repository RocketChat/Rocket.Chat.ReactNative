import { useState } from 'react';

import I18n from '../../../i18n';
import { showConfirmationAlert } from '../../../lib/methods/helpers/info';
import SSLPinning from '../../../lib/methods/helpers/sslPinning';
import { CERTIFICATE_KEY } from '../../../lib/constants';
import userPreferences from '../../../lib/methods/userPreferences';

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
		const certificate = userPreferences.getString(`${CERTIFICATE_KEY}-${server}`);
		if (certificate) {
			SSLPinning?.setCertificate(certificate, server);
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
