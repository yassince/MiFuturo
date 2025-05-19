import express from 'express'
const app = express();

import { UserController } from './Controllers/UserController.js';

const PORT = process.env.PORT ?? 1234;

app.get('/:name', UserController.getUser)
app.get('/', UserController.getAll)


app.listen(PORT, () => {
    console.log(`The server is running in http://localhost:${PORT}`);
})