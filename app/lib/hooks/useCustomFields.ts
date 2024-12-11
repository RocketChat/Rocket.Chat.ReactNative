import { useMemo } from 'react';
import log from '../../lib/methods/helpers/log';

const useParsedCustomFields = (Accounts_CustomFields: string) => {
	const parsedCustomFields = useMemo(() => {
		let parsed: any = {};
		if (Accounts_CustomFields) {
			try {
				parsed = JSON.parse(Accounts_CustomFields);
			} catch (error) {
				log(error);
			}
		}
		return parsed;
	}, [Accounts_CustomFields]);

	return { parsedCustomFields };
};

export default useParsedCustomFields;
