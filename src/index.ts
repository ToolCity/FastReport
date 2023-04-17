import express, { Request, Response } from 'express';
const PORT = process.env.PORT || 5000
import dotenv from 'dotenv'
dotenv.config()

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Types 
enum PSICategories {
    PERFORMANCE = 'performance',
    ACCESSIBILITY = 'accessibility',
    BEST_PRACTICES = 'best-practices',
    SEO = 'seo',
}

// Stores and Global variables
const pageSpeedAPIKey = process.env.PSI_API_KEY
const baselineStore = [
    {
        id : 'DA0524CF-3073-4346-ACDA-F5816650FE8A',        
        performance : 0.9,
        accessibility : 0.9,
        best_practices : 0.9,
    }
]

const configStore = [
    {
        id : 'DA0524CF-3073-4346-ACDA-F5816650FE8A',
        url : 'https://www.builder.io',
        pathnames : ['/', '/c/docs/getting-started', '/c/docs/developers'],
        alert : {
            email: 'support@builder.io',
        }
    }
]

const defaultCategory = [PSICategories.PERFORMANCE]
// Utility functions
const setUpQuery = (url:string, category: PSICategories[] = defaultCategory) => {
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

const getMetrics = (auditRefs : Record<string, any>[], audits:Record<string, any>) => {
    return auditRefs.map((audit:Record<string, any>) => {
        const {id, weight} = audit
        const auditData = audits[id]
        const {score, displayValue} = auditData
        return {id, score, weight, displayValue}
    })
}
const getParticularScore = (category : Record<string, any>, audits : Record<string, any>) => {
    const {score, auditRefs} = category
    const metrics = getMetrics(auditRefs, audits)
    return {score, metrics}
}

const getScore = (categories: Record<string, any>, audits: Record<string, any>, category:PSICategories[] = defaultCategory) => {
    let score: Record<string, any> = {}
    for(let key in categories){
        if(category.includes(key as PSICategories)){
            const categoryScore = getParticularScore(categories[key], audits)
            score[key] = categoryScore
        }
    }
    return score
}

app.route('/baseline')
    .get((req: Request, res: Response) => {
        const {apiKey} = req.query
        if(!apiKey){
            res.status(400).json({error: 'apiKey is required'})
            return
        }
        const baseline = baselineStore.find(baseline => baseline.id === apiKey)
        if(!baseline){
            res.status(404).json({error: 'baseline not found'})
            return
        }
        res.json({baseline})
    })
    .post((req: Request, res: Response) => {
        res.send('generate a baseline')
    })

app.route('/config')
    .get((req: Request, res: Response) => {
        const {apiKey} = req.query
        if(!apiKey){
            res.status(400).json({error: 'apiKey is required'})
            return
        }
        const config = configStore.find(config => config.id === apiKey)
        if(!config){
            res.status(404).json({error: 'config not found'})
            return
        }
        res.json({config})
    })
    .post((req: Request, res: Response) => {
        res.send('generate a config and return apiKey')
    })
    .patch((req: Request, res: Response) => {
        res.send('update the config')
    })


app.route('/trigger')
    .get(async (req: Request, res: Response) => {
        // query => apiKey, alert, github
        const {apiKey} = req.query
        const {category} = req.query
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
        
        const {url, pathnames} = config
        const queries = pathnames.map(pathname => setUpQuery(url + pathname, chosenCategory))
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
            const uri = url + pathnames[index]
            if(result.status === 'fulfilled'){
                const score = result.value
                return {uri, ...score}
            }else{
                return {uri, error: result.reason.message, failed: true}
            }
        })
        res.json(report);
    })
    .post((req: Request, res: Response) => {
        // trigger for the given url and pathnames
    })


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`)
})