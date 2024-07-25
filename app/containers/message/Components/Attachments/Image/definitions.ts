import { StyleProp, TextStyle } from 'react-native';

import { IAttachment, IUserMessage } from '../../../../../definitions';
import { TGetCustomEmoji } from '../../../../../definitions/IEmoji';

export interface IImageContainer {
	file: IAttachment;
	// imageUrl?: string;
	showAttachment?: (file: IAttachment) => void;
	style?: StyleProp<TextStyle>[];
	isReply?: boolean;
	getCustomEmoji?: TGetCustomEmoji;
	author?: IUserMessage;
	msg?: string;
}

export type TFileStatus = 'not-cached' | 'loading' | 'cached';

export interface IMessageImage {
	uri: string;
	status: TFileStatus;
	encrypted: boolean;
}
