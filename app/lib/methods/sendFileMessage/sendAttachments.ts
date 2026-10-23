import { type IShareAttachment, type IUser } from '~/definitions';
import { closeUnclosedCodeBlock } from '../helpers/closeUnclosedCodeBlock';
import { sendFileMessage } from './index';

const ROTATED_ORIENTATIONS = ['5', '6', '7', '8'];

export const sendAttachments = ({
	attachments,
	rid,
	tmid,
	server,
	user,
	altTextSupported,
	getMsg,
	onSent
}: {
	attachments: IShareAttachment[];
	rid: string;
	tmid: string | undefined;
	server: string;
	user: Partial<Pick<IUser, 'id' | 'token'>>;
	altTextSupported: boolean;
	getMsg: (attachment: IShareAttachment, index: number) => string | undefined;
	onSent?: (attachment: IShareAttachment) => void;
}): Promise<PromiseSettledResult<void>[]> =>
	Promise.allSettled(
		attachments.map(async (attachment, index) => {
			const { filename: name, mime: type, description, altText, size, path, canUpload, exif } = attachment;
			let { height, width } = attachment;

			if (!canUpload) {
				return;
			}

			if (exif?.Orientation && ROTATED_ORIENTATIONS.includes(exif.Orientation)) {
				[width, height] = [height, width];
			}

			const msg = getMsg(attachment, index);

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
			onSent?.(attachment);
		})
	);
