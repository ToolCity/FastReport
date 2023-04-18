import { PSICategories } from "../types/index.js";
import dotenv from 'dotenv'
dotenv.config()

const pageSpeedAPIKey = process.env.PSI_API_KEY
export const defaultCategory = [PSICategories.PERFORMANCE]

export const setUpQuery = (url:string, category: PSICategories[] = defaultCategory) => {
    const api = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    const parameters: Record<string, any> = {
      url,
      key: pageSpeedAPIKey,
      category
    };
    let query_string = ''
    for(let key in parameters){
      if(Array.isArray(parameters[key])){
          parameters[key] = parameters[key].join(`&${key}=`)
      }
      query_string += `${key}=${parameters[key]}&`
    }
    let query = `${api}?${query_string}`;
    return query;
  }
  
export const getMetrics = (auditRefs : Record<string, any>[], audits:Record<string, any>) => {
      return auditRefs.map((audit:Record<string, any>) => {
          const {id, weight} = audit
          const auditData = audits[id]
          const {score, displayValue} = auditData
          return {id, score, weight, displayValue}
      })
  }
export const getParticularScore = (category : Record<string, any>, audits : Record<string, any>) => {
      const {score, auditRefs} = category
      const metrics = getMetrics(auditRefs, audits)
      return {score, metrics}
}
  
export const getScore = (categories: Record<string, any>, audits: Record<string, any>, category:PSICategories[] = defaultCategory) => {
      let score: Record<string, any> = {}
      for(let key in categories){
          if(category.includes(key as PSICategories)){
              const categoryScore = getParticularScore(categories[key], audits)
              score[key] = categoryScore
          }
      }
      return score
  }
  