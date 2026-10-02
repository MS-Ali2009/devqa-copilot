import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { loadEnvironment } from './env';
import { banner, c, printError, printInfo, printSuccess } from './colors';
import { runGenerate } from './generator';
import { runAgent } from './agent';
import { OutputMode, InputType } from '@/types/copilot';

// Load environment variables (.env.local / .env)
loadEnvironment();

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Show Help
  if (args.includes('--help') || args.includes('-h') || args[0] === 'help') {
    showHelp();
    return;
  }

  // Autonomous Agent Subcommand
  if (args[0] === 'agent' || args[0] === 'act' || args[0] === 'run') {
    const goal = args.slice(1).filter((a) => !a.startsWith('-')).join(' ');
    const forceMock = args.includes('--mock');
    if (!goal) {
      printError('Please provide a goal for the agent. Example:');
      console.log(c.cyan('  npm run cli -- agent "Fix typecheck errors and run unit tests"'));
      return;
    }
    await runAgent({ goal, forceMock });
    return;
  }

  // System Health / Status Check
  if (args[0] === 'status' || args[0] === 'health') {
    checkHealth();
    return;
  }

  // Check if non-interactive arguments were supplied
  const parsed = parseArgs(args);

  if (parsed.hasArgs) {
    let inputContent = parsed.prompt;
    if (parsed.file) {
      const fullPath = path.resolve(process.cwd(), parsed.file);
      if (!fs.existsSync(fullPath)) {
        printError(`File not found: ${parsed.file}`);
        process.exit(1);
      }
      inputContent = fs.readFileSync(fullPath, 'utf-8');
      printInfo(`Loaded input from file: ${c.bold(parsed.file)}`);
    }

    if (!inputContent) {
      printError('Missing input prompt or file. Use --help for usage instructions.');
      process.exit(1);
    }

    await runGenerate({
      prompt: inputContent,
      outputMode: parsed.mode,
      inputType: parsed.type,
      outputFile: parsed.output,
      language: parsed.lang,
      platform: parsed.platform,
      forceMock: parsed.mock,
    });
    return;
  }

  // If no arguments, launch Interactive Wizard
  await runInteractiveMenu();
}

function parseArgs(args: string[]): {
  hasArgs: boolean;
  prompt: string;
  mode?: OutputMode;
  type?: InputType;
  file?: string;
  output?: string;
  lang?: 'english' | 'roman_urdu';
  platform?: string;
  mock: boolean;
} {
  let prompt = '';
  let mode: OutputMode | undefined;
  let type: InputType | undefined;
  let file: string | undefined;
  let output: string | undefined;
  let lang: 'english' | 'roman_urdu' | undefined;
  let platform: string | undefined;
  let mock = false;

  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === 'generate' || arg === 'gen') continue;

    if (arg === '-m' || arg === '--mode') {
      mode = args[++i] as OutputMode;
    } else if (arg === '-p' || arg === '--prompt') {
      prompt = args[++i] || '';
    } else if (arg === '-t' || arg === '--type') {
      type = args[++i] as InputType;
    } else if (arg === '-f' || arg === '--file') {
      file = args[++i];
    } else if (arg === '-o' || arg === '--output') {
      output = args[++i];
    } else if (arg === '--lang') {
      lang = args[++i] as any;
    } else if (arg === '--platform') {
      platform = args[++i];
    } else if (arg === '--mock') {
      mock = true;
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  if (!prompt && positional.length > 0) {
    prompt = positional.join(' ');
  }

  // Clean any stray quotes
  if (prompt) {
    prompt = prompt.replace(/^["']|["']$/g, '').trim();
  }

  const hasArgs = Boolean(prompt || file);
  return { hasArgs, prompt, mode, type, file, output, lang, platform, mock };
}

async function runInteractiveMenu(): Promise<void> {
  console.log(banner);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

  try {
    console.log(c.bold('Choose an operation:'));
    console.log(`  ${c.cyan('1)')} Generate QA & Engineering Artifact (Test Cases, PRDs, Checklists)`);
    console.log(`  ${c.cyan('2)')} Autonomous Coding Agent (Give task, agent edits files & runs commands)`);
    console.log(`  ${c.cyan('3)')} System & AI Health Check`);
    console.log(`  ${c.cyan('0)')} Exit\n`);

    const choice = (await question(c.bold('Enter choice [1-3, 0]: '))).trim();

    if (choice === '1') {
      console.log(`\n${c.bold('Select Output Mode:')}`);
      console.log('  1) qa_test_cases (QA Test Suite Matrix)');
      console.log('  2) acceptance_criteria (Given/When/Then scenarios)');
      console.log('  3) developer_checklist (UI, API, Data, Observability)');
      console.log('  4) bug_report (Reproduction steps, severity, priority)');
      console.log('  5) full_analysis (Comprehensive 15-section analysis)');
      console.log('  6) api_test_matrix (Payloads, edge cases, auth tests)\n');

      const modeNum = (await question('Select Mode [1-6, default 1]: ')).trim() || '1';
      const modeMap: Record<string, OutputMode> = {
        '1': 'qa_test_cases',
        '2': 'acceptance_criteria',
        '3': 'developer_checklist',
        '4': 'bug_report',
        '5': 'full_analysis',
        '6': 'api_test_matrix',
      };
      const selectedMode = modeMap[modeNum] || 'qa_test_cases';

      const prompt = await question('\nEnter Ticket, User Story, or Prompt:\n> ');
      if (!prompt.trim()) {
        printError('Input cannot be empty.');
        return;
      }

      const saveFile = (await question('\nSave to file? (e.g. output.md or leave empty for console): ')).trim();

      rl.close();
      await runGenerate({
        prompt,
        outputMode: selectedMode,
        outputFile: saveFile || undefined,
      });
    } else if (choice === '2') {
      const goal = await question('\nEnter Coding Task / Goal for Autonomous Agent:\n> ');
      if (!goal.trim()) {
        printError('Goal cannot be empty.');
        return;
      }
      rl.close();
      await runAgent({ goal });
    } else if (choice === '3') {
      rl.close();
      checkHealth();
    } else {
      console.log(c.dim('Goodbye!'));
      rl.close();
    }
  } catch (err: any) {
    rl.close();
    printError(err.message);
  }
}

function checkHealth(): void {
  console.log(`\n${c.bold('DevQA Copilot System Status')}`);
  console.log(c.dim('─'.repeat(45)));

  const groqKey = process.env.GROQ_API_KEY;
  const hasGroq = Boolean(groqKey && groqKey.startsWith('gsk_'));
  console.log(`Groq API Key:       ${hasGroq ? c.green('Configured (gsk_...)') : c.yellow('Not set (using Mock)')}`);

  const sessionSecret = process.env.SESSION_SECRET;
  const hasSecret = Boolean(sessionSecret && sessionSecret.length >= 32);
  console.log(`Session Secret:     ${hasSecret ? c.green('Configured (>=32 chars)') : c.yellow('Not set')}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  console.log(`Supabase Database:  ${supabaseUrl ? c.green('Configured') : c.dim('Optional (Offline mode ready)')}`);

  console.log(c.dim('─'.repeat(45)));
  printSuccess('CLI is operational and ready to use.\n');
}

function showHelp(): void {
  console.log(banner);
  console.log(`${c.bold('USAGE:')}
  npm run cli -- [command] [options]
  npx devqa [command] [options]

${c.bold('COMMANDS:')}
  ${c.cyan('generate, gen')}     Generate engineering and QA artifacts from prompt or file (default)
  ${c.cyan('agent, act, run')}   Launch autonomous agent to perform coding and CLI tasks
  ${c.cyan('health, status')}    Check AI provider and environment configuration
  ${c.cyan('help')}              Show this help message

${c.bold('OPTIONS:')}
  ${c.yellow('-m, --mode <mode>')}       Output mode: qa_test_cases, acceptance_criteria,
                              developer_checklist, bug_report, full_analysis,
                              api_test_matrix, etc. (Default: full_analysis)
  ${c.yellow('-f, --file <path>')}       Read input from a markdown or text file
  ${c.yellow('-o, --output <path>')}     Write output directly to a file
  ${c.yellow('-t, --type <type>')}       Input artifact type: user_story, jira_ticket, bug_notes
  ${c.yellow('--lang <lang>')}           english | roman_urdu (Default: english)
  ${c.yellow('--platform <plat>')}       web | mobile | api | backend | fullstack
  ${c.yellow('--mock')}                  Force offline mock AI provider

${c.bold('EXAMPLES:')}
  # 1. Interactive wizard (Menu mode)
  npm run cli

  # 2. Generate QA test cases from direct prompt
  npm run cli -- "User Story: Stripe one-click checkout" --mode qa_test_cases

  # 3. Read Jira ticket from file and save result to tests.md
  npm run cli -- --file ./ticket.md --mode qa_test_cases --output ./tests.md

  # 4. Autonomous coding agent (CMD se code fix aur test karwana)
  npm run cli -- agent "Run vitest and fix any broken tests"
`);
}

main().catch((err) => {
  printError(err.message || 'An error occurred.');
  process.exit(1);
});
