import Model from '@nozbe/watermelondb/Model';

import { E2EType, MessageType } from './IMessage';

export interface IUpload {
	id?: string;
	rid: string;
	path: string;
	name?: string;
	tmid?: string;
	description?: string;
	size: number;
	type?: string;
	store?: string;
	progress?: number;
	error?: boolean;
	subscription?: { id: string };
	msg?: string;
	t?: MessageType;
	e2e?: E2EType;
}

export type TUploadModel = IUpload &
	Model & {
		asPlain: () => IUpload;
	};

export interface IUploadFile {
	rid: string;
	path: string;
	name?: string;
	tmid?: string;
	description?: string;
	size: number;
	type: string;
	// store?: string;
	// progress?: number;
	msg?: string;
	// t?: MessageType;
	// e2e?: E2EType;
}
