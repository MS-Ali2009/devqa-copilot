/**
 * Minimal zero-dependency ANSI styling helper for clean terminal outputs.
 */
const isColorSupported =
  process.stdout.isTTY &&
  (!process.env.NO_COLOR &&
    (process.env.TERM !== 'dumb' || Boolean(process.env.CI)));

function wrap(code: number, close: number = 39): (text: string) => string {
  if (!isColorSupported) return (text: string) => text;
  return (text: string) => `\x1b[${code}m${text}\x1b[${close}m`;
}

export const c = {
  reset: (text: string) => (isColorSupported ? `\x1b[0m${text}` : text),
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  italic: wrap(3, 23),
  underline: wrap(4, 24),
  red: wrap(31),
  green: wrap(32),
  yellow: wrap(33),
  blue: wrap(34),
  magenta: wrap(35),
  cyan: wrap(36),
  white: wrap(37),
  gray: wrap(90),
  bgEmerald: (text: string) => (isColorSupported ? `\x1b[48;5;29m\x1b[37m${text}\x1b[0m` : text),
  bgBlue: (text: string) => (isColorSupported ? `\x1b[44m\x1b[37m${text}\x1b[0m` : text),
  bgDark: (text: string) => (isColorSupported ? `\x1b[48;5;235m${text}\x1b[0m` : text),
};

export const banner = `
${c.green(c.bold('   ██████╗ ███████╗██╗   ██╗ ██████╗  █████╗ '))}${c.cyan(c.bold(' ██████╗ ██████╗ ██████╗ '))}
${c.green(c.bold('   ██╔══██╗██╔════╝██║   ██║██╔═══██╗██╔══██╗'))}${c.cyan(c.bold('██╔════╝██╔═══██╗██╔══██╗'))}
${c.green(c.bold('   ██║  ██║█████╗  ██║   ██║██║   ██║███████║'))}${c.cyan(c.bold('██║     ██║   ██║██████╔╝'))}
${c.green(c.bold('   ██║  ██║██╔══╝  ╚██╗ ██╔╝██║▄▄ ██║██╔══██║'))}${c.cyan(c.bold('██║     ██║   ██║██╔═══╝ '))}
${c.green(c.bold('   ██████╔╝███████╗ ╚████╔╝ ╚██████╔╝██║  ██║'))}${c.cyan(c.bold('╚██████╗╚██████╔╝██║     '))}
${c.green(c.bold('   ╚═════╝ ╚══════╝  ╚═══╝   ╚══▀▀═╝ ╚═╝  ╚═╝'))}${c.cyan(c.bold(' ╚═════╝ ╚═════╝ ╚═╝     '))}
              ${c.dim('Personal Engineering & QA AI Assistant (CLI)')}
`;

export function printStep(step: number, title: string): void {
  console.log(`\n${c.cyan(`[Step ${step}]`)} ${c.bold(title)}`);
}

export function printSuccess(message: string): void {
  console.log(`${c.green('✔')} ${message}`);
}

export function printWarning(message: string): void {
  console.log(`${c.yellow('▲')} ${message}`);
}

export function printError(message: string): void {
  console.log(`${c.red('✖')} ${message}`);
}

export function printInfo(message: string): void {
  console.log(`${c.blue('ℹ')} ${message}`);
}
