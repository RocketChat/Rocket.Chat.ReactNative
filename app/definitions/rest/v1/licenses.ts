export type LicensesEndpoints = {
	'licenses.info': {
		GET: () => {
			license: {
				activeModules: string[];
			};
		};
	};
};
