import * as uri from 'uri-js';

export const urlParse = (url: string): string => uri.serialize(uri.parse(url));
