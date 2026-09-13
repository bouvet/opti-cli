// @ts-nocheck

export const colors = {
  cyan: (msg) => `\x1b[36m${msg}\x1b[0m`,
  gray: (msg) => `\x1b[90m${msg}\x1b[0m`,
  red: (msg) => `\x1b[31m${msg}\x1b[0m`,
  green: (msg) => `\x1b[32m${msg}\x1b[0m`,
  yellow: (msg) => `\x1b[33m${msg}\x1b[0m`,
  yellowMuted: (msg) => `\x1b[38;5;94m${msg}\x1b[0m`,
  bold: (msg) => `\x1b[1m${msg}\x1b[22m`,
  white: (msg) => `\x1b[97m${msg}\x1b[0m`,
};

export class Printer {
  command = ' ';

  constructor(commandName) {
    if (commandName) {
      this.command = commandName;
    }
  }

  /**
   * General info message
   * @param {string} message
   */
  info(message) {
    console.log(
      colors.green('∘'),
      colors.gray(this.command),
      colors.cyan(message)
    );
  }

  /**
   * Neutral ">" log
   * @param {string} message
   */
  neutral(message) {
    console.log(' ', colors.gray('>'), colors.gray(message));
  }

  path(title, path) {
    console.log(
      ' ',
      colors.gray('|'),
      colors.gray(title || ''),
      colors.gray('→'),
      colors.gray(path)
    );
  }

  /**
   *
   * @param {string} message
   * @param {{prefixMessage?: string, prefixColor?: keyof typeof colors }} [options]
   */
  success(message, options) {
    if (options) {
      console.log(
        colors.green('✔'),
        colors[options.prefixColor || 'gray'](
          options.prefixMessage || this.command
        ),
        colors.cyan(message)
      );
      return;
    }
    console.log(
      colors.green('✔'),
      colors.gray(this.command),
      colors.cyan(message)
    );
  }

  done(message) {
    this.group();
    console.log(colors.red('♥'), colors.bold(message));
  }

  /**
   *
   * @param {string} key
   * @param {string} value
   */
  env(key, value) {
    console.log(
      Array(15 - key.length)
        .fill(' ')
        .join(''),
      colors.gray(key),
      colors.gray('⦂'),
      colors.cyan(value)
    );
  }

  /**
   * Adds an empty line for spacing
   * @param  {...any} _logs
   */
  group(..._logs) {
    console.log('');
  }

  /**
   * Logs an error message with optional stack trace and additional details.
   *
   * @param {...any} args - The arguments for the error function.
   *   - The first argument is the main error message (string).
   *   - The second argument (optional) is an Error object or string.
   *   - Additional arguments (optional) are logged as extra details.
   */
  error(...args) {
    console.log(
      `❌ `,
      colors.red(args[0]),
      args[1] ? '\n' + colors.gray(args[1].stack || args[1]) : '',
      args[2] ? '\n\n' + args.splice(2).join('\n') : ''
    );
  }

  help(msg) {
    console.log(`🤔 ${colors.yellow(msg)}`);
  }
}
