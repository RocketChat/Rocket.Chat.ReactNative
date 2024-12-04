import log from '../../../lib/methods/helpers/log';

const getParsedCustomFields = (Accounts_CustomFields: string) => {
	let parsedCustomFields: any = {};
	if (Accounts_CustomFields) {
		try {
			parsedCustomFields = JSON.parse(Accounts_CustomFields);
		} catch (e) {
			log(e);
		}
	}

	return parsedCustomFields;
};
export default getParsedCustomFields;
