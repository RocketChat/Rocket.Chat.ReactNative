import type { TestFixtures } from 'e2e';
import { test as base } from '@e2e-dev/mobile';

import type { Fixtures } from './flows';

type AgentFixtures = Fixtures & Pick<TestFixtures, 'agent'>;

export const test = base.extend<{ agentFixtures: AgentFixtures }, { fixtures: Fixtures }>({
	fixtures: [({ app, device, platform, screen }, provide) => provide({ app, device, platform, screen }), { scope: 'worker' }],
	agentFixtures: ({ agent, fixtures }, provide) => provide({ ...fixtures, agent })
});

export const { afterAll, afterEach, beforeAll } = test;
