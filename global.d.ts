declare global {
  var quit: typeof process.exit;

  interface ProjectConfig {
    PROJECT_NAME: string,
    BACPAC_PATH: string;
    DB_NAME: string;
    SQLEDGE_CONTAINER_NAME: string;
    PORT: string;
    CONNECTION_STRING: string;
    PROJECT_ROOT_PATH: string;
    APPSETTINGS_PATH: string;
  }

  namespace NodeJS {
    interface Process {
      opti?: {
        projectConfig: ProjectConfig;
        constants: {
          defaultDBPort: number
        };
      };
    }
  }
}



export {};
