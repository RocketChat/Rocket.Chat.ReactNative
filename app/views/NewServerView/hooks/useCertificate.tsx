import { useState } from 'react';

import I18n from '../../../i18n';
import { showConfirmationAlert } from '../../../lib/methods/helpers/info';
import SSLPinning from '../../../lib/methods/helpers/sslPinning';

const useCertificate = () => {
	const [certificate, setCertificate] = useState<string | null>(null);

	const chooseCertificate = async () => {
		try {
			const certificate = await SSLPinning?.pickCertificate();
			setCertificate(certificate);
		} catch {
			// Do nothing
		}
	};

	const removeCertificate = () => {
		showConfirmationAlert({
			message: I18n.t('You_will_unset_a_certificate_for_this_server'),
			confirmationText: I18n.t('Remove'),
			onPress: () => setCertificate(null) // We don't need delete file from DocumentPicker because it is a temp file
		});
	};

	return {
		certificate,
		chooseCertificate,
		removeCertificate
	};
};

export default useCertificate;
