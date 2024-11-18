import { TAnyMessageModel } from '../../IMessage';
import { IAppActionButton } from '../../IAppActionButton';

export type AppsEndpoints = {
	actionButtons: {
		GET: () => IAppActionButton[];
	};
	'ui.interaction/:appId': {
		POST: (params: {
			type: 'actionButton';
			actionId: string;
			payload: {
				context: IAppActionButton['context'];
				message?: TAnyMessageModel;
			};
			mid?: string;
			tmid?: string;
			rid?: string;
			triggerId: string;
		}) => void;
	};
};
