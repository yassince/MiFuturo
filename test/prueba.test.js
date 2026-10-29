import supertest from 'supertest'
import { pool } from '../db/pool.js'
import { app, createApp } from '../app.js'

afterAll(async () => {
    await pool.end()
})

describe('paginas publicas', () => {
    it('responde 200 en la home', async () => {
        const response = await supertest(app).get('/')
        expect(response.status).toBe(200)
    })

    it('el pool activo es el de db/pool.js', () => {
        expect(pool.options.max).toBe(10)
        expect(pool.options.idleTimeoutMillis).toBe(30_000)
        expect(pool.options.connectionTimeoutMillis).toBe(5_000)
    })

    it('el healthcheck no depende de la base de datos', async () => {
        const response = await supertest(app).get('/health')
        expect(response.status).toBe(200)
        expect(response.body.status).toBe('ok')
    })

    it('envia cabeceras de seguridad y oculta Express', async () => {
        const response = await supertest(app).get('/')
        expect(response.headers['x-content-type-options']).toBe('nosniff')
        expect(response.headers['x-frame-options']).toBe('DENY')
        expect(response.headers['x-powered-by']).toBeUndefined()
        expect(response.headers['content-security-policy']).toMatch(/default-src/)
    })

    it('un perfil sin sesion vuelve al login', async () => {
        const response = await supertest(app).get('/User/Perfil')
        expect(response.status).toBe(302)
        expect(response.headers.location).toMatch(/login/i)
    })
})

describe('csrf y limite de login', () => {
    it('el formulario de login incluye el token', async () => {
        const response = await supertest(app).get('/User/Login')
        expect(response.status).toBe(200)
        expect(response.text).toMatch(/name="_csrf"/)
    })

    it('un post sin token responde 403 y no enseña el stack', async () => {
        const response = await supertest(app)
            .post('/User/Login')
            .type('form')
            .send({ dni: '00000000T', contraseña: 'Aa1!aaaa' })

        expect(response.status).toBe(403)
        expect(response.text).not.toMatch(/node_modules|at User/)
    })

    it('bloquea el login despues del limite', async () => {
        const limitado = createApp({ loginRateLimit: 2 })
        const cuerpo = { dni: '00000000T', contraseña: 'Aa1!aaaa' }

        await supertest(limitado).post('/User/Login').type('form').send(cuerpo)
        await supertest(limitado).post('/User/Login').type('form').send(cuerpo)
        const blocked = await supertest(limitado).post('/User/Login').type('form').send(cuerpo)

        expect(blocked.status).toBe(429)
    })

    it('rechaza un cuerpo enorme', async () => {
        const response = await supertest(app)
            .post('/User/Login')
            .set('Content-Type', 'application/json')
            .send({ relleno: 'x'.repeat(200_000) })

        expect(response.status).toBe(413)
    })
})
