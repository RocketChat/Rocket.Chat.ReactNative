import { type HandMessage } from '~/lib/services/conference/callDataProtocol';

export const isHandNews = (message: HandMessage, alreadyUp: boolean): boolean =>
	message.raised && !message.rebroadcast && !alreadyUp;
