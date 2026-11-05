import { type IShareAttachment, type IUser } from '~/definitions';
import { closeUnclosedCodeBlock } from '../helpers/closeUnclosedCodeBlock';
import log from '../helpers/log';
import { sendFileMessage } from './index';

const ROTATED_ORIENTATIONS = ['5', '6', '7', '8'];

export const sendAttachments = async ({
	attachments,
	rid,
	tmid,
	server,
	user,
	altTextSupported,
	getMsg
}: {
	attachments: IShareAttachment[];
	rid: string;
	tmid: string | undefined;
	server: string;
	user: Partial<Pick<IUser, 'id' | 'token'>>;
	altTextSupported: boolean;
	getMsg: (attachment: IShareAttachment) => string | undefined;
}): Promise<IShareAttachment[]> => {
	const results = await Promise.allSettled(
		attachments.map(async attachment => {
			const { filename: name, mime: type, description, altText, size, path, canUpload, exif } = attachment;
			let { height, width } = attachment;

			if (!canUpload) {
				return;
			}

			if (exif?.Orientation && ROTATED_ORIENTATIONS.includes(exif.Orientation)) {
				[width, height] = [height, width];
			}

			const msg = getMsg(attachment);

			await sendFileMessage(
				rid,
				{
					rid,
					name,
					description: altTextSupported ? altText : description,
					size,
					type,
					path,
					msg: msg && closeUnclosedCodeBlock(msg),
					height,
					width
				},
				tmid,
				server,
				user
			);
		})
	);
	return attachments.filter((attachment, index) => {
		const result = results[index];
		if (result.status === 'rejected') {
			log(result.reason);
			return true;
		}
		return !attachment.canUpload;
	});
};
