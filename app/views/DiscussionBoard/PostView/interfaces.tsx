export type CommentProps = {
	user: {
		name: string;
		profile_image: string;
	};
	date: string;
	description: string;
	reactions: any[];
	_id: string,
	rid: string,
	tmid: string
};

export type CommentOptionsModalProps = {
	show: boolean;
	comment: CommentProps;
	close: () => void;
	onDelete: () => void;
	onReport: () => void;
	showDelete: boolean;
	showMessage: boolean;
};

export enum ReportType {
	COMMENT = 'COMMENT',
	POST = 'POST'
}

export type PostReportModalProps = {
	show: boolean;
	type: ReportType;
	cancel: () => void;
	report: () => void;
	onText: (e: any) => void;
};

export enum DeleteType {
	COMMENT = 'COMMENT',
	POST = 'POST'
}

export type PostDeleteModalProps = {
	show: boolean;
	type: DeleteType;
	close: () => void;
	delete: () => void;
};
