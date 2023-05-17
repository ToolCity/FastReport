import * as core from '@actions/core';
import axios from 'axios';

async function run(): Promise<void> {
  try {
    const apiKey: string = core.getInput('apiKey');
    if (!apiKey) {
      throw new Error('apiKey is required');
    }
    // trigger a lighthouse report check
    const response = await axios.get(`http://127.0.0.1:5000/api/trigger?apiKey=${apiKey}`);
    if (response.status !== 200) {
      throw new Error('Failed to trigger report check');
    }
    core.debug('Triggered report check');
    core.setOutput('response', response.data);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
