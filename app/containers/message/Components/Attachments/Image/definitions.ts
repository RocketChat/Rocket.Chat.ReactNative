import { IAttachment, IUserMessage } from '../../../../../definitions';
import { TGetCustomEmoji } from '../../../../../definitions/IEmoji';
import { TDownloadState } from '../../../../../lib/methods/handleMediaDownload';

export interface IImageContainer {
	file: IAttachment;
	showAttachment?: (file: IAttachment) => void;
	getCustomEmoji?: TGetCustomEmoji;
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
