/* eslint-disable @typescript-eslint/no-unused-vars */
import { Endpoints } from '../v1';

type ReplacePlaceholders<TPath extends string> = string extends TPath
	? TPath
	: TPath extends `${infer Start}:${infer _Param}/${infer Rest}`
	? `${Start}${string}/${ReplacePlaceholders<Rest>}`
	: TPath extends `${infer Start}:${infer _Param}`
	? `${Start}${string}`
	: TPath;

type KeyOfEach<T> = T extends any ? keyof T : never;

type GetParams<TOperation> = TOperation extends (...args: any) => any
	? Parameters<TOperation>[0] extends void
		? void
		: Parameters<TOperation>[0]
	: never;

type GetResult<TOperation> = TOperation extends (...args: any) => any ? ReturnType<TOperation> : never;

type OperationsByPathPatternAndMethod<
	TPathPattern extends keyof Endpoints,
	TMethod extends KeyOfEach<Endpoints[TPathPattern]> = KeyOfEach<Endpoints[TPathPattern]>
> = TMethod extends any
	? {
			pathPattern: TPathPattern;
			method: TMethod;
			path: ReplacePlaceholders<TPathPattern>;
			params: GetParams<Endpoints[TPathPattern][TMethod]>;
			result: GetResult<Endpoints[TPathPattern][TMethod]>;
	  }
	: never;

type OperationsByPathPattern<TPathPattern extends keyof Endpoints> = TPathPattern extends any
	? OperationsByPathPatternAndMethod<TPathPattern>
	: never;

type Operations = OperationsByPathPattern<keyof Endpoints>;

type Method = Operations['method'];

export type PathPattern = Operations['pathPattern'];

type Path = Operations['path'];

//

export type Serialized<T> = T extends Date
	? Exclude<T, Date> | string
	: T extends boolean | number | string | null | undefined
	? T
	: T extends {}
	? {
			[K in keyof T]: Serialized<T[K]>;
	  }
	: null;

export type MatchPathPattern<TPath extends Path> = TPath extends any
	? Extract<Operations, { path: TPath }>['pathPattern']
	: never;

export type OperationResult<
	TMethod extends Method,
	TPathPattern extends PathPattern
> = TMethod extends keyof Endpoints[TPathPattern] ? GetResult<Endpoints[TPathPattern][TMethod]> : never;

export type PathFor<TMethod extends Method> = TMethod extends any ? Extract<Operations, { method: TMethod }>['path'] : never;

export type OperationParams<
	TMethod extends Method,
	TPathPattern extends PathPattern
> = TMethod extends keyof Endpoints[TPathPattern] ? GetParams<Endpoints[TPathPattern][TMethod]> : never;

type SuccessResult<T> = T & { success: true };

type FailureResult<T, TStack = undefined, TErrorType = undefined, TErrorDetails = undefined> = {
	success: false;
	error: T;
	stack: TStack;
	errorType: TErrorType;
	details: TErrorDetails;
};

type UnauthorizedResult<T> = {
	success: false;
	error: T | 'unauthorized';
};

export type ResultFor<TMethod extends Method, TPathPattern extends PathPattern> =
	| SuccessResult<OperationResult<TMethod, TPathPattern>>
	| FailureResult<unknown, unknown, unknown, unknown>
	| UnauthorizedResult<unknown>;

export type ErrorResult = FailureResult<unknown, unknown, unknown, unknown>;
