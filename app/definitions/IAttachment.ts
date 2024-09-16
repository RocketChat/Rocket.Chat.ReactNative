import { IUser } from './IUser';
import { E2EType, IAttachmentTranslations, IMessageE2EEContent } from './IMessage';

export type TAttachmentEncryption = {
	iv: string;
	key: any; // JsonWebKey
};

export interface IAttachment {
	ts?: string | Date;
	title?: string;
	type?: string;
	size?: number;
	description?: string;
	title_link?: string;
	image_url?: string;
	image_type?: string;
	image_size?: number;
	image_dimensions?: { width?: number; height?: number };
	image_preview?: string;
	video_url?: string;
	video_type?: string;
	video_size?: number;
	audio_url?: string;
	audio_type?: string;
	audio_size?: number;
	title_link_download?: boolean;
	attachments?: IAttachment[];
	fields?: IAttachment[];
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
	translations?: IAttachmentTranslations;
	e2e?: E2EType;
	encryption?: TAttachmentEncryption;
	format?: string;
	hashes?: {
		sha256: string;
	};
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
	content?: IMessageE2EEContent;
}

export interface IShareAttachment {
	filename: string;
	description?: string;
	size: number;
	mime?: string;
	path: string;
	canUpload: boolean;
	error?: any;
	uri: string;
	width?: number;
	height?: number;
	exif?: {
		Orientation: string;
	};
}
