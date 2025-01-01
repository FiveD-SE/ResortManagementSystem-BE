module.exports = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: '.',
	testEnvironment: 'node',
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	collectCoverageFrom: ['**/*.(t|j)s'],
	coverageDirectory: './coverage',
	testMatch: ['<rootDir>/src/**/*.spec.ts'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@modules/(.*)$': '<rootDir>/src/modules/$1',
		'^@decorators/(.*)$': '<rootDir>/src/decorators/$1',
		'^@constraints/(.*)$': '<rootDir>/src/constraints/$1',
		'^@services/(.*)$': '<rootDir>/src/services/$1',
	},
	projects: [
		{
			displayName: 'unit',
			testMatch: ['<rootDir>/src/**/*.spec.ts'],
		},
		{
			displayName: 'e2e',
			testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
			moduleNameMapper: {
				'^@/(.*)$': '<rootDir>/src/$1',
				'^@modules/(.*)$': '<rootDir>/src/modules/$1',
				'^@decorators/(.*)$': '<rootDir>/src/decorators/$1',
				'^@constraints/(.*)$': '<rootDir>/src/constraints/$1',
				'^@services/(.*)$': '<rootDir>/src/services/$1',
			},
		},
	],
};
