import * as Sharing from 'expo-sharing';
import { IShareAttachment } from '../../../definitions';

export const shareMedia = async ({ url }: { url: string }): Promise<{ success: boolean; error?: string }> => {
	try {
		if (!url) {
			return { success: false };
		}

		const isAvailable = await Sharing.isAvailableAsync();

		if (!isAvailable) {
			return { success: false, error: 'error-share-file' };
		}

		await Sharing.shareAsync(url);
		return { success: true };
	} catch (e) {
		return { success: false, error: 'error-share-file' };
	}
};
