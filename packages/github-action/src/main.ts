import * as core from '@actions/core';
import axios from 'axios';

async function run(): Promise<void> {
  try {
    const apiKey: string = core.getInput('apiKey');
    if (!apiKey) {
      throw new Error('apiKey is required');
    }
    // trigger a lighthouse report check
    // TODO: this url needs to be replaced with the deployed one
    // because github-actions creates its own env and request does not reaches our localhost
    // hence tests are failing
    const response = await axios.get(`http://127.0.0.1:5000/api/config?apiKey=${apiKey}`);
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
