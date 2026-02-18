import EscPosUSB from './EscPosUSB.js'

import {
    cut,
    selectJustification,
    bold,
    selectCharacterSize,
    printAndFeedLines,
} from './EscPosEncoder.js';

import { text } from './utils/text.js'

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
    selectJustification('centered'),
    selectCharacterSize(2, 2),
    bold(), text('Shopping list'), bold(false), LF,
    selectCharacterSize(1, 1),
    LF,
    text('This is a test file'),
    printAndFeedLines(10),
    cut(),
].flat())

const printer = new EscPosUSB()

printer.open()
printer.write(buffer)
