import parsePng from 'parse-png'
import fs from 'fs/promises'

import type { PNGWithMetadata } from 'pngjs'

export function convertImageToRasterBitImage(png: PNGWithMetadata) {
    const data = []

    for (let y = 0; y < png.height; y++) {
        const row = []
        for (let x = 0; x < png.width; x++) {
            const i = (y * png.width + x) * 4

            const r = png.data[i]
            const g = png.data[i + 1]
            const b = png.data[i + 2]
            const a = png.data[i + 3]

            const value = r ?? 0

            row.push(value == 0 ? 1 : 0)
        }

        data.push(row)
    }

    return data
}

export async function convertImageFromFileToRasterBitImage(path: string) {
    const file = await fs.readFile(path)
    const png: PNGWithMetadata = await parsePng(file)

    /* {
        width: 200,
        height: 133,
        depth: 8,
        interlace: false,
        palette: false,
        color: true,
        alpha: false,
        bpp: 3,
        colorType: 2,
        data: <Buffer 29 48 4d ...>,
    } */

    return convertImageToRasterBitImage(png)
}