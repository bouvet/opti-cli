import path from 'path';

export const constants = {
  projectName: path.basename(process.cwd()).toLowerCase(),
  defaultDBPort: 1433,
};
