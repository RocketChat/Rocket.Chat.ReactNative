import { withAppduct } from '@appduct/e2e';
import type { TestFixtures } from 'e2e';
import { test as mobileTest } from '@e2e-dev/mobile';

import type { Fixtures } from './flows';

type AgentFixtures = Fixtures & Pick<TestFixtures, 'agent'>;

export const test = withAppduct(mobileTest).extend<{ fixtures: Fixtures; agentFixtures: AgentFixtures }>({
	fixtures: ({ app, appduct, device, platform, screen }, provide) => provide({ app, appduct, device, platform, screen }),
	agentFixtures: ({ agent, fixtures }, provide) => provide({ ...fixtures, agent })
});

export const { afterAll, afterEach, beforeAll } = test;
