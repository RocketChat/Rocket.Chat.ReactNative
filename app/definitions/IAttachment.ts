export interface IAttachment {
	ts: Date;
	title: string;
	type: string;
	description: string;
	title_link?: string;
	image_url?: string;
	image_type?: string;
	video_url?: string;
	video_type?: string;
	title_link_download?: boolean;
	fields?: IAttachment[];
	image_dimensions?: { width?: number; height?: number };
	image_preview?: string;
	image_size?: number;
	author_name?: string;
	author_icon?: string;
	message_link?: string;
	text?: string;
	short?: boolean;
	value?: string;
	author_link?: string;
	color?: string;
	thumb_url?: string;
}
