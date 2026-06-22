import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'sqlite',
	driver: 'expo',
	schema: './app/lib/database/driver/schema/app.ts',
	out: './app/lib/database/driver/migrations/app'
});
