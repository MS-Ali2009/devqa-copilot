import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import Groq from 'groq-sdk';
import { c, printError, printInfo, printStep, printSuccess, printWarning } from './colors';

const execAsync = promisify(exec);

export interface AgentCliOptions {
  goal: string;
  maxSteps?: number;
  forceMock?: boolean;
}

interface ToolAction {
  action: 'read_file' | 'write_file' | 'list_dir' | 'run_command' | 'search_files' | 'finish_task';
  path?: string;
  content?: string;
  command?: string;
  query?: string;
  dir?: string;
  summary?: string;
}

const SYSTEM_PROMPT = `You are DevQA Copilot Autonomous CLI Agent.
You operate directly on the user's codebase from the command line.

You have access to the following tools:
1. read_file: {"action": "read_file", "path": "relative/path/to/file"}
2. write_file: {"action": "write_file", "path": "relative/path/to/file", "content": "full file content"}
3. list_dir: {"action": "list_dir", "path": "relative/path"}
4. run_command: {"action": "run_command", "command": "cmd string"}
5. search_files: {"action": "search_files", "query": "text to find", "dir": "optional/dir"}
6. finish_task: {"action": "finish_task", "summary": "Detailed summary of everything accomplished"}

STRICT OUTPUT FORMAT:
You MUST respond with a Thought followed by EXACTLY ONE JSON block representing your tool action:

Thought: Explain your reasoning and what you intend to do.
\`\`\`json
{
  "action": "<tool_name>",
  ...
}
\`\`\`

RULES:
- Always examine relevant files before editing.
- After making edits or changes, run tests (e.g. npm run test, npm run typecheck) to verify.
- If an error occurs, analyze it and fix it.
- When the goal is completed, invoke the "finish_task" tool with a comprehensive summary.
- Keep tool paths relative to the current workspace root.
`;

export async function runAgent(options: AgentCliOptions): Promise<void> {
  const { goal, maxSteps = 15, forceMock = false } = options;
  const workspaceRoot = process.cwd();

  console.log(`\n${c.bold(c.cyan('🚀 Starting DevQA Autonomous Coding Agent'))}`);
  console.log(`${c.dim('Goal:')} ${c.bold(goal)}`);
  console.log(`${c.dim('Workspace:')} ${workspaceRoot}\n`);

  const apiKey = process.env.GROQ_API_KEY?.trim();
  const isMock = forceMock || !apiKey;

  if (isMock) {
    printWarning('Running in Simulation / Mock Mode (Set GROQ_API_KEY for live autonomous execution).');
    await runMockAgent(goal);
    return;
  }

  const groq = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile';

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `YOUR GOAL:\n${goal}\n\nPlease take the first step.` },
  ];

  for (let step = 1; step <= maxSteps; step++) {
    printStep(step, `Agent Reasoning & Decision (Step ${step}/${maxSteps})`);

    let responseContent = '';
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.1,
        max_tokens: 2048,
      });
      responseContent = completion.choices[0]?.message?.content || '';
    } catch (err: any) {
      printError(`AI Provider error: ${err.message}`);
      break;
    }

    console.log(`\n${c.dim(responseContent.trim())}\n`);
    messages.push({ role: 'assistant', content: responseContent });

    // Parse JSON tool call
    const toolCall = parseToolCall(responseContent);
    if (!toolCall) {
      messages.push({
        role: 'user',
        content: 'Error: No valid JSON tool action found in your response. Please output a valid tool call JSON block.',
      });
      continue;
    }

    if (toolCall.action === 'finish_task') {
      console.log(`\n${c.bold(c.green('🎉 TASK COMPLETED SUCCESSFULLY!'))}`);
      console.log(c.dim('─'.repeat(70)));
      console.log(toolCall.summary || 'Goal achieved.');
      console.log(c.dim('─'.repeat(70)));
      return;
    }

    // Execute tool
    const toolResult = await executeTool(toolCall, workspaceRoot);
    messages.push({
      role: 'user',
      content: `Tool Execution Result:\n${toolResult}`,
    });
  }

  printWarning(`Reached maximum step limit (${maxSteps} steps). Agent loop stopped.`);
}

function parseToolCall(text: string): ToolAction | null {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const rawJson = jsonMatch ? jsonMatch[1] : text;

  try {
    const parsed = JSON.parse(rawJson.trim());
    if (parsed && typeof parsed.action === 'string') {
      return parsed as ToolAction;
    }
  } catch {
    // Attempt fallback line extraction
    const lines = text.split('\n');
    let buffer = '';
    let recording = false;
    for (const line of lines) {
      if (line.trim().startsWith('{')) recording = true;
      if (recording) buffer += line + '\n';
      if (recording && line.trim().endsWith('}')) {
        try {
          const obj = JSON.parse(buffer.trim());
          if (obj && obj.action) return obj as ToolAction;
        } catch {
          // Keep searching
        }
      }
    }
  }
  return null;
}

async function executeTool(tool: ToolAction, root: string): Promise<string> {
  switch (tool.action) {
    case 'read_file': {
      if (!tool.path) return 'Error: Missing path';
      const target = path.resolve(root, tool.path);
      printInfo(`Reading: ${c.cyan(tool.path)}`);
      try {
        if (!fs.existsSync(target)) return `Error: File not found: ${tool.path}`;
        const content = fs.readFileSync(target, 'utf-8');
        return `File content of ${tool.path} (${content.length} characters):\n${content.slice(0, 8000)}`;
      } catch (err: any) {
        return `Error reading file: ${err.message}`;
      }
    }

    case 'write_file': {
      if (!tool.path || tool.content === undefined) return 'Error: Missing path or content';
      const target = path.resolve(root, tool.path);
      printInfo(`Writing: ${c.cyan(tool.path)}`);
      try {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, tool.content, 'utf-8');
        printSuccess(`Saved ${tool.path} (${tool.content.length} chars)`);
        return `Successfully wrote to ${tool.path}`;
      } catch (err: any) {
        return `Error writing file: ${err.message}`;
      }
    }

    case 'list_dir': {
      const target = path.resolve(root, tool.path || '.');
      printInfo(`Listing directory: ${c.cyan(tool.path || '.')}`);
      try {
        if (!fs.existsSync(target)) return `Directory not found: ${tool.path}`;
        const entries = fs.readdirSync(target, { withFileTypes: true });
        const list = entries
          .map((e) => `${e.isDirectory() ? '[DIR] ' : '[FILE]'} ${e.name}`)
          .join('\n');
        return `Directory contents of ${tool.path || '.'}:\n${list}`;
      } catch (err: any) {
        return `Error listing directory: ${err.message}`;
      }
    }

    case 'run_command': {
      if (!tool.command) return 'Error: Missing command';
      printInfo(`Executing: ${c.yellow(tool.command)}`);
      try {
        const { stdout, stderr } = await execAsync(tool.command, {
          cwd: root,
          timeout: 45000,
          maxBuffer: 1024 * 1024 * 5,
        });
        const out = (stdout + '\n' + stderr).trim();
        console.log(c.dim(`Output (${Math.min(out.length, 300)} chars shown):`));
        console.log(c.dim(out.slice(0, 300) + (out.length > 300 ? '...' : '')));
        return out.length > 0 ? out.slice(0, 8000) : 'Command completed successfully with no output.';
      } catch (err: any) {
        const out = ((err.stdout || '') + '\n' + (err.stderr || '') + '\n' + err.message).trim();
        printWarning(`Command exited with error: ${err.message}`);
        return `Command execution failed:\n${out.slice(0, 8000)}`;
      }
    }

    case 'search_files': {
      if (!tool.query) return 'Error: Missing search query';
      printInfo(`Searching for "${c.cyan(tool.query)}"`);
      try {
        // Quick grep/ripgrep or node fallback
        const searchDir = path.resolve(root, tool.dir || '.');
        const matches: string[] = [];
        searchRecursive(searchDir, tool.query, root, matches, 25);
        if (matches.length === 0) return `No matches found for "${tool.query}".`;
        return `Found ${matches.length} matches:\n${matches.join('\n')}`;
      } catch (err: any) {
        return `Search error: ${err.message}`;
      }
    }

    default:
      return `Unknown tool action: ${(tool as any).action}`;
  }
}

function searchRecursive(dir: string, query: string, root: string, results: string[], max: number): void {
  if (results.length >= max) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (results.length >= max) break;
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchRecursive(full, query, root, results, max);
    } else if (entry.isFile()) {
      try {
        const text = fs.readFileSync(full, 'utf-8');
        if (text.includes(query)) {
          const rel = path.relative(root, full);
          results.push(rel);
        }
      } catch {
        // Skip binary files
      }
    }
  }
}

async function runMockAgent(goal: string): Promise<void> {
  printStep(1, 'Simulation Mode — Inspecting workspace');
  printInfo('Reading project configuration...');
  await new Promise((r) => setTimeout(r, 600));
  printSuccess('Project verified: Next.js 14 + TypeScript + Vitest');

  printStep(2, 'Simulating tool execution');
  printInfo(`Executing: ${c.yellow('npm run test')}`);
  await new Promise((r) => setTimeout(r, 800));
  printSuccess('Simulated execution completed.');

  console.log(`\n${c.bold(c.green('🎉 SIMULATION COMPLETED!'))}`);
  console.log(c.dim('Goal: ' + goal));
  console.log(c.yellow('Tip: Add GROQ_API_KEY in .env.local to enable live multi-turn agent execution with Llama 3.3 70B!'));
}
