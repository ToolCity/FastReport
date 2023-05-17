import * as core from '@actions/core';

async function run(): Promise<void> {
  try {
    const apiKey: string = core.getInput('apiKey');
    if (!apiKey) {
      throw new Error('apiKey is required');
    }
    // trigger a lighthouse report check
    const report = await fetch(`http://localhost:5000/api/trigger?apiKey=${apiKey}`);
    if (report.status !== 200) {
      throw new Error('Failed to trigger report check');
    }
    const response = await report.json();
    core.debug('Triggered report check');
    core.setOutput('response', response);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
