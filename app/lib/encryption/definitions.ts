import { IUploadFile } from '../../definitions';

export type TGetContent = (
	_id: string,
	fileUrl: string
) => Promise<{
	algorithm: 'rc.v1.aes-sha2';
	ciphertext: string;
}>;

export type TEncryptFileResult = Promise<{ file: IUploadFile; getContent?: TGetContent }>;

export type TEncryptFile = (rid: string, file: IUploadFile) => TEncryptFileResult;
