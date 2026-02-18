import assert from 'node:assert/strict'

const GS = 0x1d
const k = 0x6b

function splitToCharCodes(s: string) {
    return s.split('').map(c => c.charCodeAt(0))
}

/** Prints a UPC-A Barcode
 * 
 * Modular check character is added automatically.
 * Left guard bar/center bar/right guard bar are added automatically.
 * */
export function printBarcodeUpcA(data: string) {
    assert(data.length == 11)

    const codes = splitToCharCodes(data)

    assert(codes.every(charCode => charCode >= 48 && charCode <= 57))
    
    return [GS, k, 65, codes.length, ...codes]
}