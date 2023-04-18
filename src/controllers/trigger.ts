import { Request, Response } from "express";
import { baselineStore, configStore } from "../store/index.js";
import {setUpQuery, getScore, defaultCategory} from '../services/pagespeed.js'
import { PSICategories } from "../types/index.js";

export const getTrigger = async (req : Request, res:Response) => {
    const {apiKey, category} = req.query
    if(!apiKey){
        res.status(400).json({error: 'apiKey is required'})
        return
    }
    const config = configStore.find(config => config.id === apiKey)
    const baseline = baselineStore.find(baseline => baseline.id === apiKey)
    if(!config){
        res.status(404).json({error: 'config not found'})
        return
    }
    // access the categories requested by user
    let chosenCategory:PSICategories[] = defaultCategory
    if(category){
        if(typeof category === 'string'){
            // @ts-ignore
            chosenCategory = category.split(',').filter((c: string) => {
                const psic = c.trim().toLocaleLowerCase()
                if(Object.values(PSICategories).includes(psic as PSICategories)){
                    return psic
                }
            })
            if(chosenCategory?.length === 0){
                res.status(400).json({error: `category should be a string separated by , and can accept only ${Object.values(PSICategories).join(', ')}`})
                return
            }
        }else{
            res.status(400).json({error: `category should be a string separated by , and can accept only ${Object.values(PSICategories).join(', ')}`})
            return
        }
    }        
    const {defaultBaseUrl, pathnames} = config
    
    const queries = pathnames.map(pathname => setUpQuery(defaultBaseUrl + pathname, chosenCategory))
    // trigger the queries
    const data = await Promise.allSettled(queries.map(async query => {
        try{
            const response = await (await fetch(query)).json()
            if(response.error){
                throw new Error(response.error.message)
            }
            const {lighthouseResult} = response
            const {categories, audits, configSettings} = lighthouseResult
            const score = getScore(categories, audits, chosenCategory)
            return {...score, configSettings}
        }catch(e){
            throw e
        }
    }))
    const report = data.map((result, index) => {
        const uri = defaultBaseUrl + pathnames[index]
        if(result.status === 'fulfilled'){
            const score = result.value
            return {uri, ...score}
        }else{
            return {uri, error: result.reason.message, failed: true}
        }
    })
      // compare the score with the baseline config for the particular URL
      // get the baseline for this apiKEY and compare the baseline vs the score for each pathname.
      // return the result as above the baseline, or below (alert!) | baseline not found
    if(!baseline){
        res.json({report, result:'baseline config not found, generate one by /POST to /baseline'})
        return
    }
    let result: Record<string, any> = {}
    report.forEach((data) => {
        if(data.failed){
            result[data.uri] = 'Failed to fetch lighthouse score and baseline comparision'
        }else{
            const baselineConfig = baseline.pathnames.find((bs) => defaultBaseUrl + bs.pathname === data.uri)
            if(!baselineConfig){
                result[data.uri] = 'Baseline config is not defined for this URL, please generate one by a POST request on /baseline'
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
                                [category] : belowBaseline ?  `Alert: Lighthouse score is less than baseline! baseline for ${category} : ${baselineScore}` : 'Above the baseline 🎉'
                            }
                        }
                    }else{
                        result[data.uri] = {
                            ...result[data.uri],
                            [category] : 'Baseline config does not exist for this metric on this particular URL'
                        }
                    }
               })
            }
        }
    })

    res.json({result, report});
}
