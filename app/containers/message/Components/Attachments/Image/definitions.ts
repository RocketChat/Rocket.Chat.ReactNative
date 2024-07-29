import { StyleProp, TextStyle } from 'react-native';

import { IAttachment, IUserMessage } from '../../../../../definitions';
import { TGetCustomEmoji } from '../../../../../definitions/IEmoji';
import { TDownloadState } from '../../../../../lib/methods/handleMediaDownload';

export interface IImageContainer {
	file: IAttachment;
	showAttachment?: (file: IAttachment) => void;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	getCustomEmoji?: TGetCustomEmoji;
	author?: IUserMessage;
	msg?: string;
}

export interface IMessageImage {
	uri: string;
	status: TDownloadState;
	encrypted: boolean;
}
