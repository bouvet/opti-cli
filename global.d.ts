declare global {
	var quit: typeof process.exit;

	interface ProjectConfig {
		PROJECT_NAME: string;
		BACPAC_PATH: string;
		DB_NAME: string;
		DB_CONTAINER_NAME: string;
		DB_PORT: string;
		CONNECTION_STRING: string;
		PROJECT_ROOT_PATH: string;
		OPTI_FOLDER: string;
		DEFAULT_PROFILE?: string;
	}

	namespace NodeJS {
		interface Process {
			opti: {
				env: ProjectConfig;
				constants: {
					defaultDBPort: number;
				};
			};
		}
	}
}

export {};
