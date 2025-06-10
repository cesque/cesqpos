import EscPosUSB from './EscPosUSB.js'

// import wrap from 'word-wrap'
import {
    printRasterBitImage,
    selectBitImageMode,
    cut,
    selectJustification,
    bold,
    selectCharacterSize,
    underline,
    selectPageMode,
    selectPrintDirectionInPageMode,
    printAndReturnToStandardModeInPageMode,
    setPrintAreaInPageMode,
    selectFont,
    setBarcodeHeight,
    selectPrintPositionOfBarcodeHriCharacters,
    selectFontForBarcodeHriCharacters,
} from './EscPosEncoder.js';
import { convertImageFromFileToRasterBitImage } from './utils/convertImageToRasterBitImage.js';
import { text } from './utils/text.js';
import { printBarcodeUpcA } from './barcodes.js';

const vendor = 0x04b8
const product = 0x0202

const LF = 0x0a
const ESC = 0x1b
const GS = 0x1d

const init = [
    0x1b, 0x40, // init
    0x1c, 0x2e, // character mode: single byte,
    0x1b, 0x4d, 0x00, // font A
]

const buffer = Buffer.from([
    ...init,
    LF, LF, LF, LF, LF, LF, LF, LF, LF,
    ...cut(),
])

const printer = new EscPosUSB(vendor, product)

printer.open()

printer.write(buffer)
