import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { safeLoad } from 'js-yaml';
import { getInput, setOutput, setFailed } from '@actions/core';

const START_TAG = '<!-- GHA START -->';
const END_TAG = '<!-- GHA END -->';

interface actionOutput {
  description?: string;
}

interface actionInput {
  required?: boolean;
  default?: string;
  description?: string;
}

interface actionContent {
  name: string;
  description: string;
  author: string;
  inputs?: Record<string, actionInput>;
  outputs?: Record<string, actionOutput>;
}

enum MODE {
  'commit' = 'commit',
  'output' = 'output',
}

enum DISPLAY {
  'table' = 'table',
  'classic' = 'classic',
}

function tableFormat(actionObject: actionContent): string {
  const o = [];
  o.push(...genInput(actionObject, DISPLAY.table));
  o.push(...gentOutput(actionObject, DISPLAY.table));
  return o.join('\n');
}

function classicFormat(actionObject: actionContent): string {
  const o = [];
  o.push(...genInput(actionObject, DISPLAY.classic));
  o.push(...gentOutput(actionObject, DISPLAY.classic));
  return o.join('\n');
}

function checkOutputFile(content: string): boolean {
  return content.indexOf(START_TAG) !== -1 && content.indexOf(END_TAG) !== -1;
}

function commitToRepo(content: string, outputPath: string): void {
  execSync(`\
  git config --local user.name \${GITHUB_ACTOR}
  git config --local user.email \${GITHUB_ACTOR}@users.noreply.github.com
  git fetch --depth=1 origin +refs/tags/*:refs/tags/*
  git commit -m "bot: GHA doc"
  git add ${outputPath}
  git push`);
}

function outputDoc(content: string) {
  setOutput('doc', content);
}

async function main(): Promise<void> {
  const mode = getInput('mode', { required: false });
  const display = getInput('display', { required: true });
  const inputPath = getInput('inputPath', { required: true });
  const outputPath = getInput('outputPath', { required: false });
  let outputFileContent: string, actionDoc: actionContent, content: string;

  if (!(mode in MODE)) return setFailed('Unknown mode');
  if (!(display in DISPLAY)) return setFailed('Unknown display');

  if (!existsSync(inputPath)) return setFailed(`Input Path: ${inputPath} not found`);
  actionDoc = safeLoad(readFileSync(inputPath, 'utf-8')) as actionContent;

  if (outputPath.length !== 0) {
    if (!existsSync(outputPath)) return setFailed(`Output Path: ${inputPath} not found`);
    outputFileContent = readFileSync(outputPath, 'utf-8');
    if (!checkOutputFile(outputFileContent)) return setFailed('Unable to find tags in the Output file');
  }
  switch (display) {
    case DISPLAY.classic:
      content = classicFormat(actionDoc);
      break;
    case DISPLAY.table:
      content = tableFormat(actionDoc);
      break;
  }
  if (mode === MODE.commit) return commitToRepo(content!, outputPath);
  if (mode === MODE.output) return outputDoc(content!);
}

function genInput(actionContent: actionContent, mode: DISPLAY.classic | DISPLAY.table) {
  const output = [];
  if (actionContent.inputs && Object.keys(actionContent.inputs).length !== 0) {
    output.push(`## Inputs`);
    for (const prop in actionContent.inputs) {
      const i = actionContent.inputs[prop];
      let defaultValue;
      if (typeof i.default === 'string' && i.default.length === 0) {
        defaultValue = `''`;
      } else if (typeof i.default === 'number' && i.default === 0) {
        defaultValue = 0;
      } else if (!i.default) {
        defaultValue = 'None';
      } else {
        defaultValue = i.default;
      }
      output.push(`- #### \`${prop}\`
      \t- **Description**: ${i.description}
      \t- **Required**: ${i.required ? 'Yes' : 'No'}
      \t- **Default Value**: ${defaultValue}
      `);
    }
    return output.join('\n');
  }
  return '';
}
function gentOutput(actionContent: actionContent, mode: DISPLAY.classic | DISPLAY.table) {
  if (actionContent.outputs && Object.keys(actionContent.outputs).length !== 0) {
    const output = [];
    output.push(`## Outputs`);
    for (const prop in actionContent.outputs) {
      const o = actionContent.outputs[prop];
      output.push(`- #### \`${prop}\`
      \t- **Description**: ${o.description}
      `);
    }
    return output.join('\n');
  }
  return '';
}

if (require.main === module) {
  main().catch((e) => {
    console.error('Something terrible happened');
    console.error(e);
    setFailed(e);
  });
}
