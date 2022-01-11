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

export interface ICannedResponse {
	_id: string;
	shortcut: string;
	text: string;
	scope: string;
	tags: string[];
	createdBy: { _id: string; username: string };
	userId: string;
	scopeName: string;
	departmentId?: string;
}
