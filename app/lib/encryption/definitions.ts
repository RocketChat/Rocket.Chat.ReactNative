import { TAttachmentEncryption, TSendFileMessageFileInfo } from '../../definitions';

export type TGetContentResult = {
	algorithm: 'rc.v1.aes-sha2';
	ciphertext: string;
};

export type TGetContent = (_id: string, fileUrl: string) => Promise<TGetContentResult>;

export type TEncryptFileResult = Promise<{
	file: TSendFileMessageFileInfo;
	getContent?: TGetContent;
	fileContent?: TGetContentResult;
}>;

export type TEncryptFile = (rid: string, file: TSendFileMessageFileInfo) => TEncryptFileResult;

export type TDecryptFile = (
	messageId: string,
	path: string,
	encryption: TAttachmentEncryption,
	originalChecksum: string
) => Promise<string | null>;

export interface IDecryptionFileQueue {
	params: Parameters<TDecryptFile>;
	resolve: (value: string | null | PromiseLike<string | null>) => void;
	reject: (reason?: any) => void;
}
