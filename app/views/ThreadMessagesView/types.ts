import { type TThreadModel } from '~/definitions';

export type TThreadRow = Pick<TThreadModel, 'id' | 'u' | 'ts' | 'msg' | 'attachments' | 'tcount' | 'replies'>;
