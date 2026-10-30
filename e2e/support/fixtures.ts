import { withAppduct } from '@appduct/e2e';
import { test as mobileTest } from '@e2e-dev/mobile';

export { afterEach } from '@e2e-dev/mobile';

export const test = withAppduct(mobileTest);
