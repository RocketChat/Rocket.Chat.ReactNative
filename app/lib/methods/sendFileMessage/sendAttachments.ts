import { type IShareAttachment } from '../../../definitions';
import { sendFileMessage } from './index';

const ROTATED_ORIENTATIONS = ['5', '6', '7', '8'];

export const sendAttachments = ({
	attachments,
	rid,
	tmid,
	server,
	altTextSupported,
	getMsg
}: {
	attachments: IShareAttachment[];
	rid: string;
	tmid: string | undefined;
	server: string;
	altTextSupported: boolean;
	getMsg: (attachment: IShareAttachment, index: number) => string | undefined;
}): Promise<void[]> =>
	Promise.all(
		attachments.map((attachment, index) => {
			const { filename: name, mime: type, description, altText, size, path, canUpload, exif } = attachment;
			let { height, width } = attachment;

			if (!canUpload) {
				return Promise.resolve();
			}

			if (exif?.Orientation && ROTATED_ORIENTATIONS.includes(exif.Orientation)) {
				[width, height] = [height, width];
			}

			return sendFileMessage(
				rid,
				{
					rid,
					name,
					description: altTextSupported ? altText : description,
					size,
					type,
					path,
					msg: getMsg(attachment, index),
					height,
					width
				},
				tmid,
				server
			);
		})
	);
