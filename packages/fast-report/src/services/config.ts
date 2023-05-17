import { configStore } from '../store';

export const getConfigService = (apiKey: string) => {
  const config = configStore.find(config => config.id === apiKey);
  return config;
};
