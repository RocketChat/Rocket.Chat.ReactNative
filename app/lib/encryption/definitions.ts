import { type RSAPrivateKey } from '@rocket.chat/mobile-crypto';

import { type TAttachmentEncryption } from '~/definitions/IAttachment';
import { type TSendFileMessageFileInfo } from '~/definitions/IUpload';

export type TGetContentResult = {
	algorithm: 'rc.v1.aes-sha2' | 'rc.v2.aes-sha2';
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
) => Promise<string>;

export interface IDecryptionFileQueue {
	params: Parameters<TDecryptFile>;
	resolve: (value: string | PromiseLike<string>) => void;
	reject: (reason?: any) => void;
}

export interface IEncryption {
	privateKey: RSAPrivateKey | null;
	publicKey: string | null;
	deleteRoomInstance: (rid: string) => void;
}
