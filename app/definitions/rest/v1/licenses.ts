export type LicensesEndpoints = {
	'licenses.info': {
		GET: () => {
			license: {
				activeModules: string[];
				hasValidLicense?: boolean;
			};
		};
	};
};
