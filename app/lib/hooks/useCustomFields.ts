import { useMemo } from 'react';

import log from '../methods/helpers/log';

const useParsedCustomFields: any = (Accounts_CustomFields: string) => {
	const parsedCustomFields = useMemo(() => {
		let parsed = {};
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
