import { configStore } from "../store/index.js"

export const getConfigService = (apiKey:string) => {
    const config = configStore.find(config => config.id === apiKey)
    return config
}