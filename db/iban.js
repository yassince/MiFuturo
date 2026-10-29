export function ibanEspanol(ccc) {
    if (!/^\d{20}$/.test(ccc)) {
        throw new Error('El CCC tiene que tener 20 dígitos')
    }

    const resto = mod97(`${ccc}142800`)
    const control = String(98 - resto).padStart(2, '0')
    return `ES${control}${ccc}`
}

function mod97(digitos) {
    let resto = 0
    for (const digito of digitos) {
        resto = (resto * 10 + Number(digito)) % 97
    }
    return resto
}
