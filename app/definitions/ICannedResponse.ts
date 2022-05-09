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
