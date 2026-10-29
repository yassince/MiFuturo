CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_documento TEXT NOT NULL,
    numero_documento TEXT NOT NULL,
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefono TEXT NOT NULL,
    direccion TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'CLIENTE' CHECK (rol IN ('CLIENTE', 'EMPLEADO')),
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'BLOQUEADO', 'CERRADO')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tipo_documento, numero_documento)
);

CREATE TABLE cuentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes (id),
    tipo TEXT NOT NULL DEFAULT 'CLIENTE' CHECK (tipo IN ('CLIENTE', 'INTERNA')),
    iban TEXT NOT NULL UNIQUE,
    moneda CHAR(3) NOT NULL DEFAULT 'EUR',
    saldo_centimos BIGINT NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'BLOQUEADA', 'CERRADA')),
    abierta_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        (tipo = 'INTERNA' AND cliente_id IS NULL)
        OR (tipo = 'CLIENTE' AND cliente_id IS NOT NULL)
    ),
    CHECK (tipo = 'INTERNA' OR saldo_centimos >= 0)
);

CREATE TABLE movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL CHECK (tipo IN ('APERTURA', 'INGRESO', 'RETIRO', 'TRANSFERENCIA', 'COMISION')),
    estado TEXT NOT NULL DEFAULT 'CONTABILIZADO' CHECK (estado IN ('CONTABILIZADO', 'ANULADO')),
    clave_idempotencia TEXT NOT NULL UNIQUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE apuntes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movimiento_id UUID NOT NULL REFERENCES movimientos (id),
    cuenta_id UUID NOT NULL REFERENCES cuentas (id),
    importe_centimos BIGINT NOT NULL CHECK (importe_centimos <> 0),
    contabilizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tarjetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_id UUID NOT NULL REFERENCES cuentas (id),
    ultimos4 CHAR(4) NOT NULL,
    mes_caducidad INT NOT NULL CHECK (mes_caducidad BETWEEN 1 AND 12),
    anio_caducidad INT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ACTIVA', 'BLOQUEADA', 'CADUCADA')),
    creada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
