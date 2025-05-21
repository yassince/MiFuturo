import mysql from 'mysql2/promise'
import 'dotenv/config'

const HOST = process.env.DB_HOST
const USER = process.env.DB_USER
const DATABASE = process.env.DB_DATABASE
const PORT = process.env.DB_PORT
const PASSWORD = process.env.DB_PASSWORD


export const pool = mysql.createPool({
    host: HOST,
    database: DATABASE,
    user: USER,
    port: PORT,
    password: PASSWORD,
    waitForConnections: true,
    connectionLimit: 20
})