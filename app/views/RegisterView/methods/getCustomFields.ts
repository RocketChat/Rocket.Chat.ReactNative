const getCustomFields = (parsedCustomFields: any) => {
	let customFields: any = {};
	Object.keys(parsedCustomFields).forEach((key: string) => {
		if (parsedCustomFields[key].defaultValue) {
			customFields[key] = parsedCustomFields[key].defaultValue;
		}
	});

	return customFields;
};

export default getCustomFields;
