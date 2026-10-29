import { app } from './app.js'

const PORT = process.env.PORT ?? 443

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor esta funcionando en http://0.0.0.0:${PORT}`)
})
