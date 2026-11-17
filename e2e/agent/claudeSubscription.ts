import type { ExecutorVerb, StepExecutor, StepExecutorContext, StepTurn, StepVerdict, StepVerdictStatus } from 'e2e';
import { isAgentError } from 'e2e/agent';
import { generateText } from 'ai';
import {
	claudeCode,
	createCustomMcpServer,
	type ClaudeCodeSettings,
	type MinimalCallToolResult
} from 'ai-sdk-provider-claude-code';
import { z } from 'zod';

const MODEL_ID = process.env.E2E_CLAUDE_MODEL ?? 'sonnet';
const SERVER_NAME = 'device';
const RUNTIME_HARD_STOPS = new Set(['STEP_BUDGET_EXHAUSTED', 'STEP_TIMEOUT', 'CANCELLED']);

const isolatedSettings: ClaudeCodeSettings = {
	tools: [],
	settingSources: [],
	permissionPrompts: 'none',
	verbatimPrompts: true,
	persistSession: false
};

export const claudeJudge = claudeCode(MODEL_ID, isolatedSettings);

const SYSTEM_PROMPT = `You drive a mobile app on an iOS simulator or Android emulator to complete one test step.
Call read_screen first. It lists one node per line as "#id role \\"name\\"". Act on nodes by their id from the latest read_screen.
After every action, call read_screen again before the next action: ids change when the screen changes.
Use screenshot only when the node list cannot answer the question.
Finish by calling complete_step exactly once:
- passed: the step's goal is reached, or the asserted condition holds.
- failed: the app does not behave as the step requires.
- blocked: the environment prevents a verdict (server down, device not responding).
Never claim a result you did not observe on screen.`;

const ASSERT_RULES = 'This step is an assertion: only read the screen, never change app state.';

type Direction = 'up' | 'down' | 'left' | 'right';
type ToolArguments = Record<string, unknown>;
type ToolOutcome = string | MinimalCallToolResult;

interface ToolSpec {
	name: string;
	description: string;
	inputSchema: z.ZodObject<z.ZodRawShape>;
	call: (args: ToolArguments) => string;
	execute: (args: ToolArguments) => Promise<ToolOutcome>;
	mutates?: boolean;
	verb?: ExecutorVerb;
}

const text = (value: string): MinimalCallToolResult => ({ content: [{ type: 'text', text: value }] });

const describeError = (error: unknown) => (error instanceof Error ? error.message : String(error));

const node = (args: ToolArguments) => ({ id: String(args.id).replace(/^#/, '') });

const nodeSchema = z.object({ id: z.string().describe('Node id from the latest read_screen, without #') });

const directionSchema = z.enum(['up', 'down', 'left', 'right']);

const buildPrompt = (context: StepExecutorContext) => {
	const { step } = context;
	const sections = [
		`Step (${step.kind}): ${step.instruction}`,
		step.params && `Params: ${JSON.stringify(step.params)}`,
		step.secrets.length > 0 && `Secrets fillable with type_secret: ${step.secrets.map(secret => secret.name).join(', ')}`,
		context.agentContext && `Context: ${context.agentContext}`,
		context.ledger && `Earlier steps:\n${context.ledger}`,
		context.replayedPrefix && `Already done by replay, do not repeat:\n${context.replayedPrefix.replayedActions.join('\n')}`,
		step.kind === 'assert' && ASSERT_RULES
	];
	return sections.filter(Boolean).join('\n\n');
};

class StepSession {
	verdict: StepVerdict | undefined;
	hardStop: unknown;
	readonly turns: StepTurn[] = [];
	readonly abort = new AbortController();

	constructor(private readonly context: StepExecutorContext) {}

	conclude(status: StepVerdictStatus, summary: string) {
		this.verdict = status === 'blocked' ? { status, summary, errorCode: 'ENVIRONMENT_UNAVAILABLE' } : { status, summary };
	}

	async run(call: string, body: () => Promise<ToolOutcome>): Promise<MinimalCallToolResult> {
		if (this.verdict) {
			return text('The step is already complete.');
		}
		try {
			const outcome = await body();
			this.record(call, typeof outcome === 'string' ? outcome : 'image');
			return typeof outcome === 'string' ? text(outcome) : outcome;
		} catch (error) {
			if (isAgentError(error) && RUNTIME_HARD_STOPS.has(error.code)) {
				this.hardStop = error;
				this.abort.abort(error);
			}
			this.record(call, describeError(error));
			return { ...text(describeError(error)), isError: true };
		}
	}

	private record(call: string, outcome: string) {
		this.turns.push({ index: this.turns.length + 1, calls: [call], outcome: outcome.slice(0, 400) });
	}

	tools(): ToolSpec[] {
		const { actions, observe } = this.context;
		return [
			{
				name: 'read_screen',
				description: 'Read the screen as text, one node per line as #id role "name"',
				inputSchema: z.object({}),
				call: () => 'read_screen',
				execute: async () => {
					const observation = await observe();
					return observation.treeUnavailable ? 'The node list is unavailable. Use screenshot.' : observation.text;
				}
			},
			{
				name: 'screenshot',
				description: 'Take a screenshot of the device screen',
				inputSchema: z.object({}),
				call: () => 'screenshot',
				execute: async () => {
					const { pixels, pixelsWithheld } = await observe({ pixels: true });
					if (!pixels) {
						return `Screenshot unavailable: ${pixelsWithheld ?? 'unknown reason'}`;
					}
					return { content: [{ type: 'image', data: Buffer.from(pixels.data).toString('base64'), mimeType: 'image/png' }] };
				}
			},
			{
				name: 'complete_step',
				description: 'Conclude the step with a verdict',
				inputSchema: z.object({
					status: z.enum(['passed', 'failed', 'blocked']),
					summary: z.string().describe('One sentence on what was observed')
				}),
				call: () => 'complete_step',
				execute: args => {
					this.conclude(args.status as StepVerdictStatus, String(args.summary));
					return Promise.resolve('Recorded.');
				}
			},
			{
				name: 'tap',
				description: 'Tap a node',
				inputSchema: nodeSchema,
				call: args => `tap(${args.id})`,
				execute: async args => (await actions.tap(node(args)), 'Tapped.'),
				mutates: true,
				verb: 'tap'
			},
			{
				name: 'long_press',
				description: 'Long press a node',
				inputSchema: nodeSchema,
				call: args => `long_press(${args.id})`,
				execute: async args => (await actions.longPress(node(args)), 'Long pressed.'),
				mutates: true,
				verb: 'longPress'
			},
			{
				name: 'type',
				description: 'Replace the text of an input node',
				inputSchema: nodeSchema.extend({ value: z.string() }),
				call: args => `type(${args.id})`,
				execute: async args => (await actions.type(node(args), String(args.value)), 'Typed.'),
				mutates: true,
				verb: 'type'
			},
			{
				name: 'type_secret',
				description: 'Fill a secret named in the step into an input node',
				inputSchema: nodeSchema.extend({ name: z.string() }),
				call: args => `type_secret(${args.id})`,
				execute: async args => (await actions.typeSecret(node(args), String(args.name)), 'Filled.'),
				mutates: true,
				verb: 'typeSecret'
			},
			{
				name: 'scroll',
				description: 'Scroll the screen, or one list node, in a direction',
				inputSchema: z.object({ direction: directionSchema, id: z.string().optional() }),
				call: args => `scroll(${args.direction})`,
				execute: async args => (await actions.scroll(args.direction as Direction, args.id ? node(args) : undefined), 'Scrolled.'),
				mutates: true,
				verb: 'scroll'
			},
			{
				name: 'scroll_until',
				description: 'Scroll until a node whose name or text reads `text` is on screen',
				inputSchema: z.object({ text: z.string(), direction: directionSchema }),
				call: args => `scroll_until(${args.text})`,
				execute: async args => (await actions.scrollUntil(String(args.text), args.direction as Direction), 'Visible now.'),
				mutates: true,
				verb: 'scrollUntil'
			},
			{
				name: 'back',
				description: 'Navigate back once',
				inputSchema: z.object({}),
				call: () => 'back',
				execute: async () => (await actions.back(), 'Went back.'),
				mutates: true,
				verb: 'back'
			},
			{
				name: 'dismiss_keyboard',
				description: 'Hide the on-screen keyboard',
				inputSchema: z.object({}),
				call: () => 'dismiss_keyboard',
				execute: async () => (await actions.dismissKeyboard(), 'Keyboard hidden.'),
				mutates: true,
				verb: 'dismissKeyboard'
			},
			{
				name: 'tap_at',
				description: 'Tap a screen point, in the coordinates of read_screen rects',
				inputSchema: z.object({ x: z.number(), y: z.number() }),
				call: args => `tap_at(${args.x},${args.y})`,
				execute: async args => (await actions.tapAt({ x: Number(args.x), y: Number(args.y) })).summary,
				mutates: true,
				verb: 'tapAt'
			}
		];
	}
}

const offeredTools = (session: StepSession, context: StepExecutorContext) => {
	const canMutate = context.step.kind === 'act';
	const offered = session
		.tools()
		.filter(spec => (spec.mutates ? canMutate : true))
		.filter(spec => (spec.verb ? context.target.verbs.has(spec.verb) : true))
		.filter(spec => spec.verb !== 'typeSecret' || context.step.secrets.length > 0)
		.filter(spec => spec.name !== 'screenshot' || !context.pixelsTainted);
	return Object.fromEntries(
		offered.map(spec => [
			spec.name,
			{
				description: spec.description,
				inputSchema: spec.inputSchema,
				handler: (args: ToolArguments) => session.run(spec.call(args), () => spec.execute(args))
			}
		])
	);
};

const NO_CONCLUSION: StepVerdict = {
	status: 'failed',
	summary: 'The model stopped without calling complete_step.',
	errorCode: 'STEP_NO_CONCLUSION'
};

export const claudeSubscriptionExecutor: StepExecutor = {
	name: 'claude-subscription',
	version: '1',
	judge: claudeJudge,
	async runStep(context) {
		const session = new StepSession(context);
		const onParentAbort = () => session.abort.abort(context.signal.reason);
		context.signal.addEventListener('abort', onParentAbort, { once: true });
		const tools = offeredTools(session, context);
		const startedAt = new Date().toISOString();
		const started = Date.now();
		try {
			const result = await generateText({
				model: claudeCode(MODEL_ID, {
					...isolatedSettings,
					maxTurns: context.budgets.maxModelCalls,
					systemPrompt: SYSTEM_PROMPT,
					mcpServers: { [SERVER_NAME]: createCustomMcpServer({ name: SERVER_NAME, tools }) },
					allowedTools: Object.keys(tools).map(name => `mcp__${SERVER_NAME}__${name}`)
				}),
				prompt: buildPrompt(context),
				abortSignal: session.abort.signal
			});
			context.budgets.recordModelCall({
				startedAt,
				durationMs: Date.now() - started,
				provider: 'claude-code',
				modelId: MODEL_ID,
				inputTokens: result.usage.inputTokens,
				outputTokens: result.usage.outputTokens
			});
		} catch (error) {
			if (!session.hardStop && !session.verdict) {
				throw error;
			}
		} finally {
			context.signal.removeEventListener('abort', onParentAbort);
			context.attachTurns(session.turns.slice(-12));
		}
		if (session.hardStop) {
			throw session.hardStop;
		}
		return session.verdict ?? NO_CONCLUSION;
	}
};
