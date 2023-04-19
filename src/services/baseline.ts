import { baselineStore } from '../store/index.js'
import { PSICategories } from '../types/index.js'

export const getBaselineService = (apiKey: string) => {
    const baseline = baselineStore.find(baseline => baseline.id === apiKey)
    return baseline
}

export const compareReportWithBaseline = (report:Record<string, any>, apiKey:string, chosenCategory: PSICategories[], defaultBaseUrl: string) => {
    const baseline = getBaselineService(apiKey)
    if(!baseline){
        return {
            result : 'baseline config not found, generate one by /POST to /baseline'
        }
    }
    let result: Record<string, any> = {}
    report.forEach((data:any) => {
        if(data.failed){
            result[data.uri] = {
                message : 'Failed to fetch lighthouse score and baseline comparision',
                failed: true
            }
        }else{
            const baselineConfig = baseline.pathnames.find((bs) => defaultBaseUrl + bs.pathname === data.uri)
            if(!baselineConfig){
                result[data.uri] = {
                    message : 'Baseline config is not defined for this URL, please generate one by a POST request on /baseline',
                    failed : true
                }
            }else{
               chosenCategory.forEach((category) => {
                    if(baselineConfig.baseline[category]){
                        const baselineScore = baselineConfig.baseline[category]
                        // @ts-ignore
                        if(data[category]){
                            // @ts-ignore
                            const belowBaseline = data[category].score < baselineScore 
                            result[data.uri] = {
                                ...result[data.uri],
                                [category] : {
                                    message: belowBaseline ?  `Alert: Lighthouse score is less than baseline! baseline for ${category} : ${baselineScore}` : 'Above the baseline 🎉',
                                    score : data[category].score,
                                    baseline : baselineScore,
                                    alertRequired : belowBaseline
                                }
                            }
                        }
                    }else{
                        result[data.uri] = {
                            ...result[data.uri],
                            [category] : {
                                message : 'Baseline config does not exist for this metric on this particular URL',
                                failed : true
                            }
                        }
                    }
               })
            }
        }
    })
    return result;
}