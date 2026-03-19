import type { OmnichannelEndpoints as RestTypingsOmnichannelEndpoints } from '@rocket.chat/rest-typings';

import type { AdaptEndpoints } from '../adaptEndpoints';

export type OmnichannelEndpoints = AdaptEndpoints<RestTypingsOmnichannelEndpoints> & {
	'livechat/inquiries.returnAsInquiry': {
		POST: (params: { roomId: string; departmentId?: string }) => void;
	};
	'livechat/config/routing': {
		GET: () => {
			success: boolean;
			config?: {
				previewRoom: boolean;
				showConnecting: boolean;
				showQueue: boolean;
				showQueueLink: boolean;
				returnQueue: boolean;
				enableTriggerAction: boolean;
				autoAssignAgent: boolean;
			};
		};
	};
};
