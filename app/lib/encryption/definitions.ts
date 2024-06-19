import { TSendFileMessageFileInfo } from '../../definitions';

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
