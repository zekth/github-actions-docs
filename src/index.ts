import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { safeLoad } from 'js-yaml';
import core from '@actions/core';

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
  let o = '';
  return o;
}

function classicFormat(actionObject: actionContent): string {
  let o = '';
  return o;
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
  core.setOutput('doc', content);
}

async function main(): Promise<void> {
  const mode = core.getInput('mode', { required: false });
  const display = core.getInput('display', { required: true });
  const inputPath = core.getInput('inputPath', { required: true });
  const outputPath = core.getInput('outputPath', { required: false });
  let outputFileContent: string, actionDoc: actionContent, content: string;

  if (!(mode in MODE)) return core.setFailed('Unknown mode');
  if (!(display in DISPLAY)) return core.setFailed('Unknown display');

  if (!existsSync(inputPath)) return core.setFailed(`Input Path: ${inputPath} not found`);
  actionDoc = safeLoad(readFileSync(inputPath, 'utf-8')) as actionContent;

  if (outputPath.length !== 0) {
    if (!existsSync(outputPath)) return core.setFailed(`Output Path: ${inputPath} not found`);
    outputFileContent = readFileSync(outputPath, 'utf-8');
    if (!checkOutputFile(outputFileContent)) return core.setFailed('Unable to find tags in the Output file');
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

if (require.main === module) {
  main().catch((e) => {
    core.error('Something terrible happened');
    core.error(e);
    core.setFailed(e);
  });
}
