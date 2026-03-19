/* eslint-disable @typescript-eslint/no-unused-vars */
import type { KeyOfEach } from '@rocket.chat/core-typings';
import type { ReplacePlaceholders } from '@rocket.chat/rest-typings';

import { type Endpoints } from '../v1';

export type { ReplacePlaceholders } from '@rocket.chat/rest-typings';

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
			path: ReplacePlaceholders<TPathPattern & string>;
			params: GetParams<Endpoints[TPathPattern][TMethod]>;
			result: GetResult<Endpoints[TPathPattern][TMethod]>;
	  }
	: never;

type OperationsByPathPattern<TPathPattern extends keyof Endpoints> = TPathPattern extends any
	? OperationsByPathPatternAndMethod<TPathPattern>
	: never;

type Operations = OperationsByPathPattern<keyof Endpoints>;

export type Method = Operations['method'];
export type PathPattern = Operations['pathPattern'];
export type Path = Operations['path'];

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

export type JoinPathPattern<TBasePath extends string, TSubPathPattern extends string> = Extract<
	PathPattern,
	`${TBasePath}${TSubPathPattern extends '' ? TSubPathPattern : `/${TSubPathPattern}`}` | TSubPathPattern
>;

export type UrlParams<T extends string> = string extends T
	? Record<string, string>
	: T extends `${string}:${infer Param}/${infer Rest}`
	? {
			[k in Param | keyof UrlParams<Rest>]: string;
	  }
	: T extends `${string}:${infer Param}`
	? {
			[k in Param]: string;
	  }
	: undefined | Record<string, never>;

export type MethodOf<TPathPattern extends PathPattern> = TPathPattern extends any ? keyof Endpoints[TPathPattern] : never;

type MethodToPathMap = {
	[TOperation in Operations as TOperation['method']]: TOperation['path'];
};

export type PathFor<TMethod extends Method> = MethodToPathMap[TMethod];

type MethodToPathWithParamsMap = {
	[TOperation in Operations as TOperation['params'] extends void ? never : TOperation['method']]: TOperation['path'];
};

type MethodToPathWithoutParamsMap = {
	[TOperation in Operations as TOperation['params'] extends void
		? TOperation['method']
		: undefined extends TOperation['params']
		? TOperation['method']
		: never]: TOperation['path'];
};

export type PathWithParamsFor<TMethod extends Method> = MethodToPathWithParamsMap[TMethod extends keyof MethodToPathWithParamsMap
	? TMethod
	: never];

export type PathWithoutParamsFor<TMethod extends Method> =
	MethodToPathWithoutParamsMap[TMethod extends keyof MethodToPathWithoutParamsMap ? TMethod : never];

export type OperationParams<
	TMethod extends Method,
	TPathPattern extends PathPattern
> = TMethod extends keyof Endpoints[TPathPattern] ? GetParams<Endpoints[TPathPattern][TMethod]> : never;

export type OperationResult<
	TMethod extends Method,
	TPathPattern extends PathPattern
> = TMethod extends keyof Endpoints[TPathPattern] ? GetResult<Endpoints[TPathPattern][TMethod]> : never;

type MethodToPathPatternToParamsMap = {
	[TMethod in Method]: {
		[TPathPattern in keyof Endpoints]: TMethod extends keyof Endpoints[TPathPattern]
			? Endpoints[TPathPattern][TMethod] extends infer TOperation
				? TOperation extends (...args: any) => any
					? Parameters<TOperation>[0]
					: never
				: never
			: never;
	};
};

type MethodToPathPatternToResultMap = {
	[TMethod in Method]: {
		[TPathPattern in keyof Endpoints]: TMethod extends keyof Endpoints[TPathPattern]
			? Endpoints[TPathPattern][TMethod] extends infer TOperation
				? TOperation extends (...args: any) => any
					? ReturnType<TOperation>
					: never
				: never
			: never;
	};
};

export type ParamsFor<
	TMethod extends Method,
	TPathPattern extends PathPattern
> = MethodToPathPatternToParamsMap[TMethod][TPathPattern];

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
	| SuccessResult<MethodToPathPatternToResultMap[TMethod][TPathPattern]>
	| FailureResult<unknown, unknown, unknown, unknown>
	| UnauthorizedResult<unknown>;

export type ErrorResult = FailureResult<unknown, unknown, unknown, unknown>;
