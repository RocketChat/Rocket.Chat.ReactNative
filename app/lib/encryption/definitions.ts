import { TSendFileMessageFileInfo } from '../../definitions';

export type TGetContent = (
	_id: string,
	fileUrl: string
) => Promise<{
	algorithm: 'rc.v1.aes-sha2';
	ciphertext: string;
}>;

export type TEncryptFileResult = Promise<{ file: TSendFileMessageFileInfo; getContent?: TGetContent }>;

export type TEncryptFile = (rid: string, file: TSendFileMessageFileInfo) => TEncryptFileResult;
