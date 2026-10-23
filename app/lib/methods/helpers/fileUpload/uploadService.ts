import { type IUploadTracker } from './definitions';

const noop = () => {};

export const trackUpload = (_cancel: () => void): IUploadTracker => ({ progress: noop, end: noop });
