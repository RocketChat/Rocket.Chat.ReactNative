import { useMemo } from 'react';

import log from '../methods/helpers/log';

interface IModifyRecordField {
	array: boolean;
	field: string;
}

interface ICustomField {
	type: 'select' | 'text';
	required: boolean;
	defaultValue?: string;
	options?: string[];
	minLength?: number;
	maxLength?: number;
	modifyRecordField?: IModifyRecordField;
}

interface IParsedCustomFields {
	[key: string]: ICustomField;
}

interface IUseParsedCustomFields {
	(Accounts_CustomFields: string): { parsedCustomFields: IParsedCustomFields | null };
}

const useParsedCustomFields: IUseParsedCustomFields = (Accounts_CustomFields: string) => {
	const parsedCustomFields = useMemo(() => {
		let parsed = {};
		if (Accounts_CustomFields) {
			try {
				parsed = JSON.parse(Accounts_CustomFields);
			} catch (error) {
				log(error);
			}
		}
		return Object.keys(parsed).length === 0 ? null : parsed;
	}, [Accounts_CustomFields]);

	return { parsedCustomFields };
};

export default useParsedCustomFields;
