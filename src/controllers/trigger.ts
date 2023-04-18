import { Request, Response } from "express";
import { configStore } from "../store/index.js";
import {setUpQuery, getScore} from '../services/pagespeed.js'
import { PSICategories } from "../types/index.js";

export const getTrigger = async (req : Request, res:Response) => {
    const {apiKey, category, url} = req.query
    if(!apiKey){
        res.status(400).json({error: 'apiKey is required'})
        return
    }
    const config = configStore.find(config => config.id === apiKey)
    if(!config){
        res.status(404).json({error: 'config not found'})
        return
    }
    // access the categories requested by user
    let chosenCategory:PSICategories[] | undefined = undefined
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
    const baseURL = url || defaultBaseUrl
    const queries = pathnames.map(pathname => setUpQuery(baseURL + pathname, chosenCategory))
    // trigger the queries
    const data = await Promise.allSettled(queries.map(async query => {
        try{
            const response = await (await fetch(query)).json()
            if(response.error){
                throw new Error(response.error.message)
            }
            const {lighthouseResult} = response
            const {categories, audits} = lighthouseResult
            const score = getScore(categories, audits, chosenCategory)
            return score
        }catch(e){
            throw e
        }
    }))
    const report = data.map((result, index) => {
        const uri = baseURL + pathnames[index]
        if(result.status === 'fulfilled'){
            const score = result.value
            return {uri, ...score}
        }else{
            return {uri, error: result.reason.message, failed: true}
        }
    })
    res.json(report);
}
