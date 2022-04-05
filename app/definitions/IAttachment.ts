import { IUser } from './IUser';

export interface IAttachment {
	ts?: string | Date;
	title?: string;
	type?: string;
	description?: string;
	title_link?: string;
	image_url?: string;
	image_type?: string;
	video_url?: string;
	video_type?: string;
	audio_url?: string;
	title_link_download?: boolean;
	attachments?: IAttachment[];
	fields?: IAttachment[];
	image_dimensions?: { width?: number; height?: number };
	image_preview?: string;
	image_size?: number;
	author_name?: string;
	author_icon?: string;
	actions?: { type: string; msg: string; text: string }[];
	message_link?: string;
	text?: string;
	short?: boolean;
	value?: string;
	author_link?: string;
	color?: string;
	thumb_url?: string;
	collapsed?: boolean;
}

export interface IServerAttachment {
	_id: string;
	name: string;
	size: number;
	type: string;
	rid: string;
	userId: string;
	AmazonS3: { path: string };
	store: string;
	identify: {
		format: string;
		size: {
			width: number;
			height: number;
		};
	};
	complete: boolean;
	etag: string;
	path: string;
	progress: boolean;
	token: string;
	uploadedAt: string | Date;
	uploading: boolean;
	url: string;
	user: Pick<IUser, '_id' | 'username' | 'name'>;
}
