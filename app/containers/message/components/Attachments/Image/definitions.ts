import { type IAttachment } from '~/definitions/IAttachment';
import { type IUserMessage } from '~/definitions/IMessage';
import { type TDownloadState } from '~/lib/methods/handleMediaDownload';

export interface IImageContainer {
	file: IAttachment;
	showAttachment?: (file: IAttachment) => void;
	author?: IUserMessage;
	msg?: string;
	imagePreview?: string;
	imageType?: string;
}

export interface IMessageImage {
	uri: string;
	status: TDownloadState;
	encrypted: boolean;
	imagePreview?: string;
	imageType?: string;
}
