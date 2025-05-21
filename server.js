import express from 'express'
const app = express();
import path from 'path'
import { fileURLToPath } from 'url';
import { UserController } from './Controllers/UserController.js';

const PORT = process.env.PORT ?? 1234;

const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename)

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

/* app.get('/:name', UserController.getUser) */

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})
app.post('/register', UserController.registerUser)


app.listen(PORT, () => {
    console.log(`The server is running in http://localhost:${PORT}`);
})