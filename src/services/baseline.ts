import { baselineStore } from '../store/index.js'

export const getBaselineService = (apiKey: string) => {
    const baseline = baselineStore.find(baseline => baseline.id === apiKey)
    return baseline
}