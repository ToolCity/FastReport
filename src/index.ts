import express, { Request, Response } from 'express';
import { baselineStore, configStore } from './store/index.js';
const PORT = process.env.PORT || 5000
import dotenv from 'dotenv'
dotenv.config()

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Types 

// Stores and Global variables


// Utility functions

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
       
    })
    .post((req: Request, res: Response) => {
        // trigger for the given url and pathnames
    })


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`)
})