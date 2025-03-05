export interface ITimestampRange {
	$gt?: { $date: string };
	$lt?: { $date: string };
	$gte?: { $date: string };
	$lte?: { $date: string };
}

export interface IDeleteMessageBulkParams {
	rid: string;
	ts?: ITimestampRange;
	users: string[];
	excludePinned?: boolean;
	ignoreDiscussion?: boolean;
	ids?: string[];
}