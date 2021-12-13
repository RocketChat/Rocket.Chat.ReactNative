export interface IDepartment {
	_id: string;
	enabled: boolean;
	name: string;
	description: string;
	showOnRegistration: boolean;
	showOnOfflineForm: boolean;
	requestTagBeforeClosingChat: boolean;
	email: string;
	chatClosingTags: string[];
	offlineMessageChannelName: string;
	maxNumberSimultaneousChat: number;
	abandonedRoomsCloseCustomMessage: string;
	waitingQueueMessage: string;
	departmentsAllowedToForward: string;
	_updatedAt: Date;
	numAgents: number;
	ancestors: string[];
}
