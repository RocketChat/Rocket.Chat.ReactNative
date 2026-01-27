/* eslint-disable @typescript-eslint/no-unused-vars */
// POC: This file implements rest-typings patterns adapted to work with our current Endpoints structure.
// Once all endpoint definitions are migrated to use @rocket.chat/rest-typings Endpoints
// (which uses /v1/ prefix paths), we can replace this with direct imports from the package.
import type { KeyOfEach } from '@rocket.chat/core-typings';
import type { ReplacePlaceholders } from '@rocket.chat/rest-typings';

import { type Endpoints } from '../v1';

// Re-export utility types from rest-typings that we can use directly
export type { ReplacePlaceholders } from '@rocket.chat/rest-typings';

// GetParams and GetResult - matching rest-typings implementation
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

// Core types matching rest-typings structure
export type Method = Operations['method'];
export type PathPattern = Operations['pathPattern'];
export type Path = Operations['path'];

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

// MatchPathPattern - matching rest-typings implementation
export type MatchPathPattern<TPath extends Path> = TPath extends any
	? Extract<Operations, { path: TPath }>['pathPattern']
	: never;

// JoinPathPattern - utility from rest-typings for combining path patterns
export type JoinPathPattern<
	TBasePath extends string,
	TSubPathPattern extends string
> = Extract<
	PathPattern,
	`${TBasePath}${TSubPathPattern extends '' ? TSubPathPattern : `/${TSubPathPattern}`}` | TSubPathPattern
>;

// UrlParams - extracts URL parameters from path patterns (from rest-typings)
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

// MethodOf - gets methods available for a path pattern (from rest-typings)
export type MethodOf<TPathPattern extends PathPattern> = TPathPattern extends any
	? keyof Endpoints[TPathPattern]
	: never;

// PathFor - matching rest-typings implementation pattern
type MethodToPathMap = {
	[TOperation in Operations as TOperation['method']]: TOperation['path'];
};

export type PathFor<TMethod extends Method> = MethodToPathMap[TMethod];

// PathWithParamsFor and PathWithoutParamsFor - additional utilities from rest-typings
// These check if the operation function has parameters (matching rest-typings pattern)
type MethodToPathWithParamsMap = {
	[TOperation in Operations as TOperation['params'] extends void
		? never
		: TOperation['method']]: TOperation['path'];
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

export type PathWithoutParamsFor<TMethod extends Method> = MethodToPathWithoutParamsMap[TMethod extends keyof MethodToPathWithoutParamsMap
	? TMethod
	: never];

// OperationParams and OperationResult - matching rest-typings implementation
export type OperationParams<
	TMethod extends Method,
	TPathPattern extends PathPattern
> = TMethod extends keyof Endpoints[TPathPattern] ? GetParams<Endpoints[TPathPattern][TMethod]> : never;

export type OperationResult<
	TMethod extends Method,
	TPathPattern extends PathPattern
> = TMethod extends keyof Endpoints[TPathPattern] ? GetResult<Endpoints[TPathPattern][TMethod]> : never;

// ParamsFor and ResultFor - using MethodToPathPatternToParamsMap pattern from rest-typings
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

export type ParamsFor<TMethod extends Method, TPathPattern extends PathPattern> =
	MethodToPathPatternToParamsMap[TMethod][TPathPattern];

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

// ResultFor wraps the base result with success/error handling (SDK-specific)
// Uses MethodToPathPatternToResultMap pattern from rest-typings
export type ResultFor<TMethod extends Method, TPathPattern extends PathPattern> =
	| SuccessResult<MethodToPathPatternToResultMap[TMethod][TPathPattern]>
	| FailureResult<unknown, unknown, unknown, unknown>
	| UnauthorizedResult<unknown>;

export type ErrorResult = FailureResult<unknown, unknown, unknown, unknown>;
