import express from 'express';
const PORT = process.env.PORT || 5000
import dotenv from 'dotenv'
import routes from './routes/index.js'
dotenv.config()

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/api', routes)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`)
})