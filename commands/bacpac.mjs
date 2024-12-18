import { getFile } from '../helpers/files.mjs';
import program from '../index.mjs';
import { log } from '../utils/logger.mjs';

const sqlpackageCommandline = ({ BACPAC_FILENAME, DB_NAME, PORT, APP_NAME }) =>
  `sqlpackage /Action:Import /SourceFile:"./${BACPAC_FILENAME}"  /TargetConnectionString:"Data Source=localhost,${PORT};Initial Catalog=${DB_NAME};User ID=SA;Password=bigStrongPassword8@;Connect Timeout=30;Encrypt=True;Trust Server Certificate=True;Authentication=SqlPassword;Application Name=${APP_NAME};Connect Retry Count=1;Connect Retry Interval=10;Command Timeout=30"`;

program
  .command('bacpac')
  .description('Get sqlpackage command for importing a .bacpac file.')
  .action(() => {
    const [noFileError, dockerCompose] = getFile('/', 'docker-compose.yml');

    if (!dockerCompose || noFileError) {
      log.error(
        "Could not find a docker-compose.yml. Have you ran 'opti setup-db'?"
      );
      return;
    }

    const env = JSON.parse(dockerCompose.match(/#\[bacpac\](.*?)\n/)[1]);
    const command = sqlpackageCommandline(env);

    log.info(
      'Open the folder where you bacpac file is located and run the following command:'
    );
    log.neutral(command);
  });
