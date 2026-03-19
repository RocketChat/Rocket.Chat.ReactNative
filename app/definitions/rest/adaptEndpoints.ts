export type RemoveV1Prefix<T> = T extends `/v1/${infer Rest}` ? Rest : T;

export type AdaptEndpoints<T> = {
	[K in keyof T as RemoveV1Prefix<K & string>]: T[K];
};
