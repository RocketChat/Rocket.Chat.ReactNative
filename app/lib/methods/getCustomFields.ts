const getCustomFields = (parsedCustomFields: any) => {
	if (!parsedCustomFields) return {};
	const customFields: any = {};
	Object.keys(parsedCustomFields).forEach((key: string) => {
		if (parsedCustomFields[key].defaultValue) {
			customFields[key] = parsedCustomFields[key].defaultValue;
		}
	});

	return customFields;
};

export default getCustomFields;
