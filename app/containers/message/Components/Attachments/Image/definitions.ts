import { type StyleProp, type TextStyle } from 'react-native';

import { type IAttachment, type IUserMessage } from '../../../../../definitions';
import { type TGetCustomEmoji } from '../../../../../definitions/IEmoji';
import { type TDownloadState } from '../../../../../lib/methods/handleMediaDownload';

export interface IImageContainer {
	file: IAttachment;
	showAttachment?: (file: IAttachment) => void;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
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
