import { IAppActionButton } from '../../IAppActionButton';

export type AppsEndpoints = {
	actionButtons: {
		GET: () => IAppActionButton[];
	};
};
