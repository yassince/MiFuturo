import { app } from './app.js'
import { pool } from './db/pool.js'
import { migrar } from './db/migrar.js'

const PORT = process.env.PORT ?? 443

if (process.env.NODE_ENV !== 'test' && process.env.DATABASE_URL) {
    const resultado = await migrar(pool)
    console.log(`Base de datos: ${resultado.estado}`)
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor esta funcionando en http://0.0.0.0:${PORT}`)
})
