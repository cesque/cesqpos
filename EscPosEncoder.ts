/*
Dots per line:
512

Characters per line
Font A: 42
Font B: 56

Character spacing 
Font A: 0.28 mm {.01"} (2 dots)
Font B: 0.28 mm {.01"} (2 dots)

Character structure
Font A: 12 × 24
Font B: 9 × 17 (including 2-dot horizontal spacing)

Line spacing (default)
4.23 mm {1/6"}
*/

import assert from 'node:assert/strict'

const LF = 0x0a
const ESC = 0x1b
const FS = 0x1c
const GS = 0x1d

export type Font = 'A' | 'B'

const fontMap: Record<Font, number> = {
    A: 0,
    B: 1,
}

/**
 * Splits a number
 */
function byteSplit(n: number) {
    assert(n >= 0)
    assert(n <= 65535)

    const highByte = Math.floor(n / 256)
    const lowByte = n % 256

    return [lowByte, highByte]
}

/** 
 * HT -- Moves the print position to the next horizontal tab position
 * 
    - This command is ignored unless the next horizontal tab position has been set.
    - If the next horizontal tab position exceeds the print area, the printer sets the print position to [Print area width + 1].
    - If this command is processed when the print position is at [Print area width + 1], the printer executes Print buffer-full printing of the current line and horizontal tab processing from the beginning of the next line. In this case, in Page mode, the printer does not execute printing, but the print position is moved.
    - Horizontal tab positions are set by ESC D.
    - The printer will not be in the beginning of the line by executing this command.
    - When underline mode is turned on, the underline will not be printed under the tab space skipped by this command.
 * */
export function horizontalTab() { return [0x9] }

/**
 * LF -- Prints the data in the print buffer and feeds one line, based on the current line spacing.
    - The amount of paper fed per line is based on the value set using the line spacing command (ESC 2 or ESC 3).
    - After printing, the print postion is moved to left side of the printable area. Also, the printer is in the status "Beginning of the line".
    - When this command is processed in Page mode, only the print position moves, and the printer does not perform actual printing.
 */
export function printAndLineFeed() { return [LF] }

/**
 * FF (Page Mode) -- In **Page mode**, prints all the data in the print buffer collectively and switches from Page mode to Standard mode.
    - This command is enabled only in Page mode. See FF (in Standard mode) to use this command in Standard mode. Page mode can be selected by ESC L.
    - The data is deleted in the print area after being printed.
    - This command returns the values set by ESC W to the default values.
    - The value set by ESC T is maintained.
    - After printing, the printer returns to Standard mode and moves the print position to left side of the printable area. Also, the printer is in the status "Beginning of the line".
 */
export function printAndReturnToStandardModeInPageMode() { return [0xc] }

// CR
// export function printAndCarriageReturn() { return [0xd] }

// DLE EOT
// export function transmitRealTimeStatus(n, a) {
//     const validN = [1, 2, 3, 4, 7, 8, 18]

//     if (!validN.includes(n)) throw new Error(`unknown value n for DLE EOT (transmitRealTimeStatus): ${n}`)

//     if (n == 7) {
//         if (a == 1 || a == 2) return [0x10, 0x4, n, a]
//         throw new Error(`unknown value a for DLE EOT (transmitRealTimeStatus) with n == 7: ${a}`)
//     }

//     if (n == 8) {
//         if (a == 3) return [0x10, 0x4, n, a]
//         throw new Error(`unknown value a for DLE EOT (transmitRealTimeStatus) with n == 8: ${a}`)
//     }

//     if (n == 18) {
//         if (a == 1 || a == 2) return [0x10, 0x4, n, a]
//         throw new Error(`unknown value a for DLE EOT (transmitRealTimeStatus) with n == 18: ${a}`)
//     }

//     return [0x10, 0x4, n]
// }

// DLE ENQ
// DLE DC4

/**
 * CAN -- In **Page mode**, deletes all the print data in the current print area.
    - This command is enabled only in Page mode. Page mode is selected by ESC L.
    - If data set in the previously specified print area is set in the currently specified print area, it is deleted.
 */
export function cancelPrintDataInPageMode() { return [0x18] }

/**
 * ESC FF -- In Page mode, prints the data in the print buffer collectively.
    - This command is enabled only in Page mode. Page mode can be selected by ESC L.
    - After printing, the printer does not clear the buffered data, the print position, or values set by other commands.
    - The printer returns to Standard mode with FF (in Page mode), ESC S, and ESC @. When it returns to Standard mode by ESC @, all settings are canceled.
    - This command is used when the data in Page mode is printed repeatedly.
 */
export function printDataInPageMode() { return [ESC, 0x0c] }

/**
 * ESC SP -- Sets the right-side character spacing to n × (horizontal or vertical motion unit). 
    - The character spacing set by this command is effective for alphanumeric, Kana, and user-defined characters.
    - When characters are enlarged, the character spacing is n times normal value.
    - When Standard mode is selected, the horizontal motion unit is used.
    - When Page mode is selected, the vertical or horizontal motion unit is used for the print direction set by ESC T.
        - When the starting position is set to the upper left or lower right of the print area using ESC T, the horizontal motion unit is used.
        - When the starting position is set to the upper right or lower left of the print area using ESC T, the vertical motion unit is used.
    - The character spacing can be set independently in Standard mode and in Page mode.
        - In Standard mode this command sets the character spacing of Standard mode.
        - in Page mode this command sets the character spacing of page mode.
    - If the horizontal or vertical motion unit is changed after this command is executed, the character spacing is not changed.
    - Settings of this command are effective until ESC @ is executed, the printer is reset, or the power is turned off.
    - It is used to change the spacing between characters.
 */
export function setRightSideCharacterSpacing(n: number = 0) {
    assert(n > 0 && n <= 255)
    return [ESC, 0x20, n] 
}

/**
 * ESC ! -- Select print mode(s)
    - Configurations of Font 1 and Font 2 are different, depending on the printer model. If the desired font type cannot be selected with this command, use ESC M.
    - The settings of font (Bit 0), double-height (Bit 4), double-width (Bit 5) and underline (Bit 7) are effective for 1-byte code characters. On some models, the settings of double-height (Bit 4), double-width (Bit 5) and underline (Bit 7) are effective also for Korean characters.
    - The emphasized print modes set by this command (Bit 3) is effective for both 1-byte code characters and multi-byte code characters.
    - Settings of this command are effective until ESC @ is executed, the printer is reset, the power is turned off, or one of the following commands is executed:
        - Bit 0 (character font): ESC M
        - Bit 3 (Emphasized mode): ESC E
        - Bit 4, 5 (character size): GS !
        - Bit 7 (underline mode): ESC -
    - When some characters in a line are double-height, all characters on the line are aligned at the Baseline.
    - When double-width mode is turned on, the characters are enlarged to the right, based on the left side of the character.
    - When both double-height and double-width modes are turned on, quadruple size characters are printed.
    - In Standard mode, the character is enlarged in the paper feed direction when double-height mode is selected, and it is enlarged perpendicular to the paper feed direction when double-width mode is selected. However, when character orientation changes in 90° clockwise rotation mode, the relationship between double-height and double-width is reversed.
    - in Page mode, double-height and double-width are on the character orientation.
    - The underline thickness is that specified by ESC -, regardless of the character size. The underline is the same color as the printed character. The printed character's color is specified by GS ( N   <Function 48> .
    - The following are not underlined.
        - 90° clockwise-rotated characters
        - white/black reverse characters
        - space set by HT, ESC $, and ESC \
    - On printers that have the Automatic font replacement function, the replaced font with GS ( E   <Function 5> (a = 111, 112, 113) is selected by this command.
 */
export function selectPrintModes(
    font: Font,
    emphasised: boolean = false,
    doubleHeight: boolean = false,
    doubleWidth: boolean = false,
    underline: boolean = false
) {
    let n = 0

    n &= fontMap[font]
    n &= (+emphasised) << 3
    n &= (+doubleHeight) << 4
    n &= (+doubleWidth) << 5
    n &= (+underline) << 7

    return [ESC, 0x20, n] 
}

/**
 * ESC $ -- Moves the print position to (nL + nH × 256) × (horizontal or vertical motion unit) from the left edge of the print area.
    - The printer ignores any setting that exceeds the print area.
    - When Standard mode is selected, the horizontal motion unit is used.
    - When Page mode is selected, the horizontal or vertical motion unit is used for the print direction set by ESC T.
        - When the starting position is set to the upper left or lower right of the print area using ESC T, the horizontal motion unit is used.
        - When the starting position is set to the upper right or lower left of the print area using ESC T, the vertical motion unit is used.
    - If the horizontal or vertical motion unit is changed after this command is executed, the print position is not changed.
    - The printer will not be in the beginning of the line by executing this command.
    - Even if underline mode is turned on, the underline will not be printed under the space skipped by this command.


 */
export function setAbsolutePrintPosition(value: number) {
    return [ESC, 0x24, ...byteSplit(value)]
}

/**
 * ESC % -- Select/cancel user-defined character set.
 * 
 * When the LSB of n is 0, the user-defined character set is canceled.
 * When the LSB of n is 1, the user-defined character set is selected.
    - When the user-defined character set is canceled, the resident character set is automatically selected.
    - settings of this command are effective until ESC @ is executed, the printer is reset, or the power is turned off.
 */
export function selectUserDefinedCharacterSet(enable: boolean = false) {
    const n = enable ? 1 : 0

    return [ESC, 0x25, n] 
}

/**
 * ESC & -- Define user-defined characters
 * 
 * When the LSB of n is 0, the user-defined character set is canceled.
 * When the LSB of n is 1, the user-defined character set is selected.
    - When the user-defined character set is canceled, the resident character set is automatically selected.
    - settings of this command are effective until ESC @ is executed, the printer is reset, or the power is turned off.
 */
export function defineUserDefinedCharacterSet(verticalBytes: number, characterCodeRangeStart: number, characterCodeRangeEnd: number, data: number[][][]) {
    assert(characterCodeRangeStart >= 32)
    assert(characterCodeRangeEnd <= 126)
    assert(characterCodeRangeEnd >= characterCodeRangeEnd)
    assert(Array.isArray(data))
    assert(data.length <= 255)
    assert(data.length == ((characterCodeRangeEnd - characterCodeRangeEnd) + 1))
    assert(data.every(character => character.length == verticalBytes))
    assert(data.every(character => character.every(line => character[0] && line.length == character[0].length)))

    const a = []
    for (const character of data) {
        if (!character[0]) throw new Error(`malformed character data in defineUserDefinedCharacterSet`)

        a.push(character[0].length)
        
        for (let x = 0; x < character[0].length; x++) {
            for (let y = 0; y < character[0].length; y++) {
                a.push(character?.[y]?.[x] ?? 0)
            }
        }
    }

    return [ESC, 0x26, verticalBytes, characterCodeRangeStart, characterCodeRangeEnd, ...a] 
}

/**
 * ESC * -- Select bit-image mode
 * 
    - Data (d) specifies a bit printed to 1 and not printed to 0.
    - If the bit image data exceeds the number of dots to be printed on a line, the excess data is ignored.
    - The bit-image is not affected by print mode (emphasized, double-strike, underline, character size, white/black reverse printing, or 90° clockwise-rotated), except for upside-down print mode.
    - After printing a bit image, the printer processes normal data.
    - When printing multiple line bit images, selecting unidirectional print mode with ESC U enables printing patterns in which the top and bottom parts are aligned vertically.
    - This command is used to print a picture or logo.
    - The relationship between the bit image data and the print result is as follows.
        - 8 dot mode: https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/image/esc_asterisk-1.png
        - 24 dot mode: https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/image/esc_asterisk-2.png
*/
export function selectBitImageMode(verticalDensity: number = 8, horizontalDensity: 'single' | 'double' = 'single', data: number[]) {
    assert(verticalDensity == 8 || verticalDensity == 24)
    assert(Array.isArray(data))
    if (verticalDensity == 24) assert(data.length % 3 == 0)

    const value = data.length / (verticalDensity == 8 ? 1 : 3)

    const m = (verticalDensity == 8 ? 0 : 32) + (horizontalDensity == 'single' ? 0 : 1)

    return [ESC, 0x2a, m, ...byteSplit(value), ...data] 
}

/**
 * ESC - -- Turn underline mode on/off
 * 
    - The underline mode is effective for alphanumeric, Kana, and user-defined characters. On some models, it is effective also for Korean characters.
    - The color of underline is the same as that of the printing character. The printing character's color is selected by GS ( N   <Function 48> .
    - Changing the character size does not affect the current underline thickness.
    - When underline mode is turned off, the following data cannot be underlined, but the thickness is maintained.
    - The printer does not underline 90° clockwise rotated characters, white/black reverse characters, and the space set by HT, ESC $, and ESC \.
    - Setting of this command is effective until ESC ! is executed, ESC @ is executed, the printer is reset, or the power is turned off.
    - Some of the printer models support the 2-dot thick underline (n = 2 or 50).
*/
export function underline(enable: boolean = false, thickness: 1 | 2 = 1) {
    assert(thickness > 0 && thickness <= 2)

    if (enable) {
        return [ESC, 0x2d, thickness] 
    }

    return [ESC, 0x2d, 0] 
}

/**
 * ESC 3 -- Sets the line spacing to the "default line spacing."
 * 
    - The line spacing can be set independently in Standard mode and in Page mode.
        - In Standard mode this command sets the line spacing of Standard mode.
        - in Page mode this command sets the line spacing of page mode.
    - Selected line spacing is effective until ESC 3 is executed, ESC @ is executed, the printer is reset, or the power is turned off.
*/
export function selectDefaultLineSpacing() {
    return [ESC, 0x32] 
}

/**
 * ESC 3 -- Sets the line spacing to n × (vertical or horizontal motion unit). 
 * 
    - The maximum line spacing is 1016 mm {40 inches}. However, it may be smaller depending on models.
    - If the specified amount exceeds the maximum line spacing, the line spacing is automatically set to the maximum.
    - When Standard mode is selected, the vertical motion unit is used.
    - When Page mode is selected, the vertical or horizontal motion unit is used for the print direction set by ESC T.
        - When the starting position is set to the upper left or lower right of the print area using ESC T, the vertical motion unit is used.
        - When the starting position is set to the upper right or lower left of the print area using ESC T, the horizontal motion unit is used.
    - The line spacing can be set independently in Standard mode and in Page mode.
        - In Standard mode this command sets the line spacing of Standard mode.
        - In Page mode this command sets the line spacing of Page mode.
    - When the motion unit is changed after the line spacing is set, the line spacing setting does not change.
    - Selected line spacing is effective until ESC 2 is executed, ESC @ is executed, the printer is reset, or the power is turned off.
*/
export function setLineSpacing(units?: number) {
    if (units == undefined) return selectDefaultLineSpacing()

    assert(units >= 0)
    assert(units <= 255)
    return [ESC, 0x33, units] 
}

// ESC =

/**
 * ESC ? -- Deletes the user-defined character pattern specified by character code n.
 * 
    - After the user-defined characters are canceled, the resident character set is printed.
    - This command can cancel user-defined characters for each font independently. To select a font, use ESC ! or ESC M.
*/
export function cancelUserDefinedCharacters(n: number) {
    assert(n >= 32)
    assert(n <= 126)
    return [ESC, 0x3F, n] 
}

/**
 * ESC @ -- Clears the data in the print buffer and resets the printer modes to the modes that were in effect when the power was turned on.
 * 
    - Any macro definitions are not cleared.
    - Offline response selection is not cleared.
    - Contents of user NV memory are not cleared.
    - NV graphics (NV bit image) and NV user memory are not cleared.
    - The maintenance counter value is not affected by this command.
    - Software setting values are not cleared.

    Notes:
    - The DIP switch settings are not checked again.
    - The data in the receive buffer is not cleared.
    - When this command is processed in Page mode, the printer deletes the data in the print areas, initializes all settings, and selects Standard mode.
    - This command can cancel all the settings, such as print mode and line feed, at the same time.
    - The command execution moves the print position to left side of the printable area. Also, the printer is in the status "Beginning of the line".
*/
export function initialise() {
    return [ESC, 0x40] 
}

export const DEFAULT_TAB_STOPS = [8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160, 168, 176, 184, 192, 200, 208, 216, 224, 232, 240, 248]

/**
 * ESC D -- Sets horizontal tab positions. n specifies the number of digits from the setting position to the left edge of the print area.
 * 
    - The horizontal tab position is stored as a value of [character width × n] measured from the beginning of the line. The character width includes the right-side character spacing, and double-width characters are selected with twice the width of normal characters.
    - The character width should be set before using this command. Settings of character fonts, space width, and enlargement affect the setting of character width.
    - A maximum of 32 horizontal tab positions can be set. Data exceeding 32 horizontal tab positions is processed as normal data.
    - This command cancels any previous horizontal tab settings.
    - Transmit [n]k in ascending order and place a NUL code at the end. ESC D NUL cancels all horizontal tab positions.
    - When [n]k is less than or equal to the preceding value [n]k-1, horizontal tab setting is finished, and the following data is processed as normal data.
    - k is not transmission data to the printer.
    - Even if the character width is changed after setting the horizontal tab positions, the setting of the horizontal tab positions will not be changed.
    - Horizontal tab position settings are effective until ESC @ is executed, the printer is reset, or the power is turned off.
    - Print position can be changed by HT.
    - When the left margin setting is changed, the horizontal tab position is also changed.
    - Horizontal tab positions that exceed the print area can be set. In this case, when the print area width is changed, available horizontal tab positions are changed.
*/
export function setHorizontalTabPositions(tabStops: number[] = DEFAULT_TAB_STOPS) {
    assert(Array.isArray(tabStops))
    assert(tabStops.length <= 32)
    assert(tabStops.every(stop => stop >= 1 && stop <= 255))

    return [ESC, 0x44, ...tabStops, 0] 
}

/**
 * ESC D -- Turn emphasized mode on/off
 * 
    - This mode is effective for alphanumeric, Kana, multilingual, and user-defined characters.
    - Settings of this command are effective until ESC ! is executed, ESC @ is executed, the printer is reset, or the power is turned off.
*/
export function bold(enable: boolean = false) {
    return [ESC, 0x45, enable ? 0x1 : 0x0] 
}

/**
 * ESC G -- Turns double-strike mode on or off.
 * 
    - This mode is effective for alphanumeric, Kana, multilingual, and user-defined characters.
    - Settings of this command are effective until ESC ! is executed, ESC @ is executed, the printer is reset, or the power is turned off.
*/
export function doubleStrike(enable: boolean = false) {
    return [ESC, 0x47, enable ? 0x1 : 0x0] 
}

/**
 * ESC J -- Prints the data in the print buffer and feeds the paper [n × (vertical or horizontal motion unit)]. 
 * 
    - When Standard mode is selected, the vertical motion unit is used.
    - When Page mode is selected, the vertical or horizontal motion unit is used for the print direction set by ESC T.
        - When the starting position is set to the upper left or lower right of the print area using ESC T, the vertical motion unit is used.
        - When the starting position is set to the upper right or lower left of the print area using ESC T, the horizontal motion unit is used.
    - The maximum paper feed amount depends on the printer model. If specified over the maximum amount, the maximum paper feed is executed.
    - After printing, the print postion is moved to left side of the printable area. Also, the printer is in the status "Beginning of the line".
    - When this command is processed in Page mode, only the print position moves; the printer does not perform actual printing.
    - This command is used to temporarily feed a specific length without changing the line spacing set by other commands.
*/
export function printAndFeedPaper(n: number = 0) {
    assert(n >= 0)
    assert(n <= 255)

    return [ESC, 0x4a, n]
}

/**
 * ESC L -- Switches from Standard mode to page mode.
    - This command is enabled only when processed at the beginning of the line in Standard mode. In other cases, this command is ignored.
    - The print position is the starting position specified by ESC T within the print area defined by ESC W.
    - The following commands switch the settings for Page modebecause these commands can be set independently in Standard mode and in Page mode:
        - ESC SP, ESC 2, ESC 3, ESC U, and FS S
    - The following commands are disabled in Page mode.
        - ESC L, FS g 1   [obsolete command] , FS q   [obsolete command] , GS ( A, GS ( C (part of functions), GS ( E, GS ( L   /   GS 8 L (part of functions), GS ( M (part of functions), GS ( P, GS T, and GS g 0
    - The following commands are not effective in Page mode.
        - ESC V, ESC a, ESC {, GS L, and GS W
    - The printer returns to Standard mode with ESC S, FF (in Page mode), and ESC @. When it returns to Standard mode by ESC @, all settings are canceled.
    - Standard mode is selected as the default.
    - in Page mode, the printer prints the data in the print buffer for the print area specified by ESC W collectively by FF (in Page mode) or ESC FF. When executing the print and paper feed commands, such as LF, CR, ESC J, and ESC d, only the print position moves; the printer does not perform actual printing.
*/
export function selectPageMode() {
    return [ESC, 0x4c]
}

/**
 * ESC M -- Selects a character font
    - The character font set by this command is effective for alphanumeric, Kana, and user-defined characters.
    - Configurations of Font A and Font B depend on the printer model.
    - Settings of this command are effective until ESC ! is executed, ESC @ is executed, the printer is reset, or the power is turned off.
    - On the printer that has the Automatic font replacement function, the replaced font with GS ( E   <Function 5> (a = 111 or 112 or 113) is selected by this command.
*/
export function selectFont(font: Font) {
    return [ESC, 0x4d, fontMap[font]]
}

export type InternationalCharacterSet = 'usa'
    | 'france'
    | 'germany'
    | 'uk'
    | 'denmark-1'
    | 'sweden'
    | 'italy'
    | 'spain-1'
    | 'japan'
    | 'norway'
    | 'denmark-2'
    | 'spain-2'
    | 'latin-america'
    | 'korea'
    | 'slovenia-croatia'
    | 'china'
/**
 * ESC R -- Select an international character set
    - The selected international character set is effective until ESC @ is executed, the printer is reset, or the power is turned off.
    - Refer to Character Code Tables for TM printers for the international characters.
*/
export function selectInternationalCharacterSet(characterSet: InternationalCharacterSet) {
    const map: Record<InternationalCharacterSet, number> = {
        usa: 0,
        france: 1,
        germany: 2,
        uk: 3,
        'denmark-1': 4,
        sweden: 5,
        italy: 6,
        'spain-1': 7,
        japan: 8,
        norway: 9,
        'denmark-2': 10,
        'spain-2': 11,
        'latin-america': 12,
        korea: 13,
        'slovenia-croatia': 14,
        china: 15,
    }

    return [ESC, 0x52, map[characterSet]]
}

/**
 * ESC S -- Switches from Page mode to Standard mode.
    - This command is enabled only in Page mode. Page mode can be selected by ESC L.
    - When this command is executed, data in all the print areas is cleared, the print area set by ESC W returns to the default value, but the value set by ESC T is maintained.
    - The following commands switch the settings for Standard mode because these commands can be set independently in Standard mode and in Page mode:
        - ESC SP, ESC 2, ESC 3, ESC U, FS S
    - In Standard mode, the following commands are ignored.
        - CAN, ESC FF, GS $, GS ( Q, GS \
    - The settings of the following commands do not affect printing in Standard mode.
        - ESC T, ESC W, GS ( P
    - Standard mode is selected as the default.
*/
export function selectStandardMode(n: number) {
    return [ESC, 0x53, n]
}

/**
 * ESC T -- In Page mode, selects the print direction and starting position using n as follows:
 * https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/image/esc_ct-1.png
    - 0: Left to right
    - 1: Bottom to top
    - 2: Right to left
    - 3: Top to bottom

    Notes:
    - The print direction set by this command is effective only in Page mode.
    - This command setting has no effect in Standard mode.
    - The parameters for the horizontal or vertical motion unit differ, depending on the starting position of the print area as follows:
        - If the starting position is the upper left or lower right of the print area:
        - These commands use horizontal motion units: ESC SP, ESC $, ESC \, FS S
        - These commands use vertical motion units: ESC 3, ESC J, ESC K, GS $, GS \
        - If the starting position is the upper right or lower left of the print area:
        - These commands use horizontal motion units: ESC 3, ESC J, ESC K, GS $, GS \
        - These commands use vertical motion units: ESC SP, ESC $, ESC \, FS S
    - Settings of this command are effective until ESC @ is executed, the printer is reset, or the power is turned off.
*/
export function selectPrintDirectionInPageMode(n: number) {
    assert(n > 0)
    assert(n <= 3)

    return [ESC, 0x54, n]
}

/**
 * ESC V -- Set print area in Page mode
    - This command can be used in Page mode. Page mode is selected by ESC L.
    - With this command, the printing position is moved to a starting point selected by ESC T in the print area set.
    - For this command, the horizontal direction means the direction perpendicular to paper feeding direction and the vertical direction means the paper feeding direction.
    - Both print area width and height cannot be set to 0.
    - The horizontal logical origin and the vertical logical origin cannot be set outside the printable area.
    - The absolute origin is the upper left of the printable area.
    - Horizontal logical origin and print area width are calculated using the horizontal motion unit.
    - Vertical logical origin and print area height are calculated using the vertical motion unit.
    - If [horizontal logical origin + print area width] exceeds the printable area, the print area width is automatically set to [horizontal printable area - horizontal logical origin].
    - If [vertical logical origin + print area height] exceeds the printable area, the print area height is automatically set to [vertical printable area - vertical logical origin].
    - Keep the following conditions in mind for printers that support GS ( P   <Function 48> .
        - The maximum area that can be specified by this command is the same as the printable area specified by GS ( P   <Function 48> .
        - The origin of this command is the same as the upper left point of the printable area specified by GS ( P   <Function 48> .
        - When adjusting the printable area of the Page modewith GS ( P   <Function 48> , specify the printable area to be the same as the setting of the printable area by this command after executing ESC L.
    - Even if the horizontal or vertical motion unit is changed after changing the printable area, the setting of the printable area will not be changed.
    - Settings of this command are effective until FF (in Page mode) is executed, ESC @ is executed, the printer is reset, or the power is turned off.
    - This command setting has no effect in Standard mode.
*/
export function setPrintAreaInPageMode(originX: number, originY: number, width: number, height: number) {
    return [
        ESC, 0x57,
        ...byteSplit(originX),
        ...byteSplit(originY),
        ...byteSplit(width),
        ...byteSplit(height),
    ]
}

/**
 * ESC V -- Set relative print position
    - The printer ignores any setting that exceeds the print area.
    - A positive number specifies movement to the right, and a negative number specifies movement to the left.
    - When Standard mode is selected, the horizontal motion unit is used.
    - When Page mode is selected, the horizontal or vertical motion unit is used for the print direction set by ESC T.
        - When the starting position is set to the upper left or lower right of the print area using ESC T, the horizontal motion unit is used.
        - When the starting position is set to the upper right or lower left of the print area using ESC T, the vertical motion unit is used.
    - Even if the vertical or horizontal motion unit is changed after changing the print position, the setting of the print position will not be changed.
    - When underline mode is turned on, the underline will not be printed under the space skipped by this command.
    - "\" corresponds to "¥" in the JIS code system.
*/
export function setRelativePrintPosition(d: number) {
    assert(d >= -32768)
    assert(d <= 32767)

    const normalised = d + 32768

    return [
        ESC, 0x5C,
        ...byteSplit(normalised),
    ]
}

export type Justification = 'left' | 'centered' | 'right'
/**
 * ESC a -- Select justification
    - When Standard mode is selected, this command is enabled only when processed at the beginning of the line in Standard mode.
    - The justification has no effect in Page mode.
    - This command executes justification in the print area set by GS L and GS W.
    - This command justifies printing data (such as characters, all graphics, barcodes, and two-dimensional code) and space area set by HT, ESC $, and ESC \.
    - Settings of this command are effective until ESC @ is executed, the printer is reset, or the power is turned off.
*/
export function selectJustification(justification: Justification = 'left') {
    const justifications: Justification[] = ['left', 'centered', 'right']

    assert(justification.includes(justification))

    const value = justifications.indexOf(justification)

    return [ESC, 0x61, value]
}

// ESC c 3
// ESC c 4
// ESC c 5

/**
 * ESC d -- Prints the data in the print buffer and feeds n lines.
    - The amount of paper fed per line is based on the value set using the line spacing command (ESC 2 or ESC 3).
    - The maximum paper feed amount depends on the printer model. If specified over the maximum amount, the maximum paper feed is executed.
    - After printing, the print postion is moved to left side of the printable area. Also, the printer is in the status "Beginning of the line".
    - When this command is processed in Page mode, only the print position moves, and the printer does not perform actual printing.
    - This command is used to temporarily feed a specific line without changing the line spacing set by other commands.
*/
export function printAndFeedLines(n: number) {
    assert(n > 0)
    assert(n <= 255)

    return [ESC, 0x64, n]
}

export type CharacterCodeTable = 'pc437-usa-standard-europe'
    | 'katakana'
    | 'pc850-multilingual'
    | 'pc860-portuguese'
    | 'pc863-canadian-french'
    | 'pc865-nordic'
    | 'wpc1252'
    | 'pc866-cyrillic-2'
    | 'pc852-latin-2'
    | 'pc858-euro'
    | 'page-255'

/**
 * ESC t -- Select character code table
    - The characters of each page are the same for alphanumeric parts (ASCII code: Hex = 20h – 7Fh / Decimal = 32 – 127), and different for the escape character parts (ASCII code: Hex = 80h – FFh / Decimal = 128 – 255).
    - The selected character code table is valid until ESC @ is executed, the printer is reset, or the power is turned off.
    - For characters in each code page, refer to Character Code Tables for TM printers > Single-byte Characters > Code Pages.
*/
export function selectCharacterCodeTable(table: CharacterCodeTable) {
    const map: Record<CharacterCodeTable, number> = {
        'pc437-usa-standard-europe': 0,
        katakana: 1,
        'pc850-multilingual': 2,
        'pc860-portuguese': 3,
        'pc863-canadian-french': 4,
        'pc865-nordic': 5,
        wpc1252: 16,
        'pc866-cyrillic-2': 17,
        'pc852-latin-2': 18,
        'pc858-euro': 19,
        'page-255': 255
    }

    return [ESC, 0x74, map[table]]
}

/**
 * ESC { -- In Standard mode, turns upside-down print mode on or off.
    - When Standard mode is selected, this command is enabled only when processed at the Beginning of the line.
    - The upside-down print mode is effective for all data in Standard mode except the following:
        - The graphics from GS ( L   /   GS 8 L   <Function 112> , GS ( L   /   GS 8 L   <Function 113> .
        - Raster bit image from GS v 0   [obsolete command] .
        - Variable vertical size bit image from GS Q 0   [obsolete command] .
    - The upside-down print mode has no effect in Page mode.
    - Settings of this command are effective until ESC @ is executed, the printer is reset, or the power is turned off.
    - When upside-down print mode is turned on, the printer prints 180°-rotated characters from right to left. The line printing order is not reversed; therefore, be careful of the order of the data transmitted.
*/
export function setUpsideDown(enable: boolean = false) {
    return [ESC, 0x7b, enable ? 0x1 : 0x0]
}

/**
 * GS ! -- In Standard mode, turns upside-down print mode on or off.
    - The character size set by this command is effective for alphanumeric, Kana, multilingual, and user-defined characters.
    - When the characters are enlarged with different heights on one line, all the characters on the line are aligned at the Baseline.
    - When the characters are enlarged widthwise, the characters are enlarged to the right, based on the left side of the character.
    - ESC ! can also turn double-width and double-height modes on or off.
    - In Standard mode, the character is enlarged in the paper feed direction when double-height mode is selected, and it is enlarged perpendicular to the paper feed direction when double-width mode is selected. However, when character orientation changes in 90° clockwise rotation mode, the relationship between double-height and double-width is reversed.
    - In Page mode, double-height and double-width are on the character orientation.
    - The setting of the character size of alphanumeric and Katakana is effective until ESC ! is executed, ESC @ is executed, the printer is reset, or the power is turned off.
    - The setting of the character size of Kanji and multilingual characters is effective until FS ! is executed, FS W is executed, ESC @ is executed, the printer is reset, or the power is turned off.
*/
export function selectCharacterSize(width: number = 1, height: number = 1) {
    assert(width >= 1)
    assert(width <= 8)
    assert(height >= 1)
    assert(height <= 8)

    const widthValue = 16 * (width - 1)
    const heightValue = 16 * (height - 1)

    const n = (widthValue << 4) + heightValue

    return [GS, 0x21, n]
}

/**
 * GS ! -- In Page mode, moves the vertical print position to (nL + nH × 256) × (vertical or horizontal motion unit) from the starting position set by ESC T. 
    - This command is enabled only in Page mode. If this command is processed in Standard mode, it is ignored.
    - The printer ignores any setting that exceeds the print area set by ESC W.
    - The horizontal or vertical motion unit is used for the print direction set by ESC T.
        - When the starting position is set to the upper left or lower right of the print area using ESC T, the vertical motion unit is used.
        - When the starting position is set to the upper right or lower left of the print area using ESC T, the horizontal motion unit is used.
    - Even if the vertical or horizontal motion unit is changed after changing the print position, the print position will not be changed.
*/
export function setAbsoluteVerticalPrintPositionInPageMode(n: number) {
    return [GS, 0x24, ...byteSplit(n)]
}

// GS ( A
// GS ( D
// GS ( E
// GS ( H
// GS ( K
// GS ( L
// GS ( N
// GS ( k
// GS :

/**
 * GS B -- Turns white/black reverse print mode on or off.
    - The white/black reverse print is effective for 1-byte code characters and multi-byte code characters.
    - When white/black reverse print mode is turned on, it also affects the right-side character spacing set by ESC SP and left- and right-side spacing of multi-byte code characters set by FS S.
    - When white/black reverse print mode is turned on, it does not affect the space between lines and the spaces skipped by HT, ESC $, or ESC \.
    - When underline mode is turned on, the printer does not underline white/black reverse characters.
    - This command is effective until ESC @ is executed, the printer is reset, or the power is turned off.
    - In white/black reverse print mode, characters are printed in white on a black background.
*/
export function inverse(enable: boolean = false) {
    return [GS, 0x42, enable ? 0x1 : 0x0]
}

export type PrintPositionOfHriCharacters = 'none' | 'above' | 'below' | 'both'
/**
 * GS H -- Selects the print position of Human Readable Interpretation (HRI) characters when printing a barcode
    - HRI characters are printed using the font specified by GS f.
    - This command setting is effective until performing of ESC @, reset or power-off.
    - HRI character is Human Readable Interpretation character indicated with barcode.
*/
export function selectPrintPositionOfBarcodeHriCharacters(position: PrintPositionOfHriCharacters) {
    const map: Record<PrintPositionOfHriCharacters, number> = {
        none: 0,
        above: 1,
        below: 2,
        both: 3,
    }

    return [GS, 0x48, map[position]]
}

// GS I

/**
 * GS L -- In Standard mode, sets the left margin to (nL + nH × 256) × (horizontal motion unit) from the left edge of the printable area. 
    - When Standard mode is selected, this command is enabled only when processed at the beginning of the line.
    - The left margin has no effect in Page mode. If this command is processed in Page mode, the left margin is set and it is enabled when the printer returns to Standard mode.
    - If the setting exceeds the printable area, the left margin is automatically set to the maximum value of the printable area.
    - If this command and GS W set the print area width to less than the width of one character, the print area width is extended to accommodate one character for the line.
    - Horizontal motion unit is used.
    - If horizontal motion unit is changed after changing left margin, left margin setting is not changed.
    - Left margin setting is effective until ESC @ is executed, the printer is reset, or the power is turned off.
    - Left margin position is left edge of the printable area. If left margin setting is changed, left edge of the printable area will move.
*/
export function setLeftMargin(n: number) {
    return [GS, 0x4C, ...byteSplit(n)]
}

/**
 * GS P -- Sets the horizontal and vertical motion units to approximately 25.4/x mm {1/x"} and approximately 25.4/y mm {1/y"}, respectively.
    - The horizontal and vertical motion units indicate the minimum pitch used for calculating the values of related commands.
    - The horizontal direction is perpendicular to the paper feed direction and the vertical direction is the paper feed direction.
    - In Standard mode, the following commands use x or y.
        - Commands using x: ESC SP, ESC $, ESC \, FS S, GS ( P, GS L, and GS W
        - Commands using y: ESC 3, ESC J, ESC K, GS ( P, and GS V
    - In Page mode, the following commands use x or y, when the starting position is set to the upper left or lower right of the print area using ESC T.
        - Commands using x: ESC SP, ESC $, ESC W, ESC \, GS ( Q, and FS S
        - Commands using y: ESC 3, ESC J, ESC K, ESC W, GS $, GS V, GS ( Q, and GS \
    - In Page mode, the following commands use x or y, when the starting position is set to the upper right or lower left of the print area using ESC T.
        - Commands using x: ESC 3, ESC J, ESC K, ESC W, GS $, GS ( Q, and GS \
        - Commands using y: ESC SP, ESC $, ESC W, ESC \, FS S, GS ( Q, and GS V
    - Setting of this command is effective until ESC @ is executed, the printer is reset, or the power is turned off.
    - The calculated result from combining this command with others is truncated to the minimum value of the mechanical pitch.
    - This command does not affect the current setting values.
*/
export function setHorizontalAndVerticalMotionUnits(x: number, y: number) {
    assert(x > 0)
    assert(x <= 255)
    assert(y > 0)
    assert(y <= 255)

    return [GS, 0x50, x, y]
}

/**
 * GS V -- Cut paper
 * There are extra cutting modes defined https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/gs_cv.html but
 * I don't think they are supported aside from partial cut
*/
export function cut(feedVertical: number = 0) {
    assert(feedVertical >= 0)
    assert(feedVertical <= 255)

    if (feedVertical > 0) {
        return [GS, 0x56, 65, feedVertical]
    }

    console.log('check if this is doing a full cut or partial')
    return [GS, 0x56, 1]
}

/**
 * GS W -- In Standard mode, sets the print area width to (nL + nH × 256) × (horizontal motion unit).
 * 
    - When Standard mode is selected, this command is enabled only when processed at the beginning of the line.
    - The print area width has no effect in Page mode. If this command is processed in Page mode, the print area width is set and it is enabled when the printer returns to Standard mode.
    - If the [left margin + print area width] exceeds the printable area, the print area width is automatically set to [printable area - left margin].
    - If this command and GS L set the print area width to less than the width of one character, the print area width is extended to accommodate one character for the line.
    - Horizontal motion unit is used.
    - If horizontal motion unit is changed after setting the printable area width, the printable area width setting will not be changed.
    - Printable area width setting is effective until ESC @ is executed, the printer is reset, or the power is turned off.
*/
export function setPrintAreaWidth(width: number = 0) {
    return [GS, 0x57, ...byteSplit(width)]
}

/**
 * GS \ -- In Page mode, moves the vertical print position to (nL + nH × 256) × (vertical or horizontal motion unit) from the current position.
    - This command is enabled only in Page mode. If this command is processed in Standard mode, it is ignored.
    - The printer ignores any setting that exceeds the print area set by ESC W.
    - A positive number specifies movement downward, and a negative number specifies movement upward.
    - The horizontal or vertical motion unit is used for the print direction set by ESC T.
        - When the starting position is set to the upper left or lower right of the print area using ESC T, the vertical motion unit is used.
        - When the starting position is set to the upper right or lower left of the print area using ESC T, the horizontal motion unit is used.
    - Even if vertical or horizontal motion unit is changed after changing the print position, the setting of print position will not be changed.
    - "\" corresponds to "¥" in the JIS code set.
*/
export function setRelativeVerticalPrintPositionInPageMode(d: number) {
    assert(d >= -32768)
    assert(d <= 32767)

    const normalised = d + 32768

    return [GS, 0x5C, ...byteSplit(normalised)]
}

// GS ^
// GS a

/**
 * GS b -- Turns smoothing mode on or off.
    - The smoothing mode is effective for quadruple-size or larger characters [alphanumeric, Kana, multilingual, and user-defined characters.]
    - This command is effective until ESC @ is executed, the printer is reset, or the power is turned off.
*/
export function setSmoothing(enable: boolean = false) {
    return [GS, 0x62, enable ? 0x1 : 0x0]
}

/**
 * GS f -- Selects a font for the Human Readable Interpretation (HRI) characters when printing a barcode.
 * 
    - The font set by this command is effective only for HRI character.
    - Variety of fonts that each printer has and the font size are shown in model specific information of ESC M.
    - HRI characters are printed at the position specified by GS H.
    - HRI character is Human Readable Interpretation character indicated with barcode.
    - The Automatic font replacement with GS ( E   <Function 5> (a = 111 or 112) is not applied to the HRI characters.
*/
export function selectFontForBarcodeHriCharacters(font: Font) {
    return [GS, 0x66, fontMap[font]]
}

// GS g

/**
 * GS h -- Sets the height of a barcode to n dots. 
 * 
    - The units for n depend on the printer model.
    - This command setting is effective until performing of ESC @, reset or power-off.
*/
export function setBarcodeHeight(n: number) {
    assert(n >= 1)
    assert(n <= 255)

    return [GS, 0x68, n]
}

// todo: implement
/**
 * GS h -- Prints the barcode using the barcode system specified.
 * 
    - The units for n depend on the printer model.
    - This command setting is effective until performing of ESC @, reset or power-off.
*/
// export type Barcode = 'upc-a'
//     | 'upc-e'
//     | 'jan13-ean13'
//     | 'jan8-ean8'
//     | 'code39'
//     | 'itf-interleaved-2-of-5'
//     | 'codabar-nw-7'
//     | 'code93'
//     | 'code128'
//     | 'gs1-128'
//     | 'gs1-databar-omnidirectional'
//     | 'gs1-databar-truncated'
//     | 'gs1-databar-limited'
//     | 'gs1-databar-expanded'
//     | 'code128-auto'




// GS r
/**
 * GS h -- Prints a raster bit image 
 * 
    - The units for n depend on the printer model.
    - This command setting is effective until performing of ESC @, reset or power-off.
*/
export function printRasterBitImage(data: number[][], verticalScale: 1 | 2 = 1, horizontalScale: 1 | 2 = 1) {
    assert(data.length >= 1)
    assert(data.length < 65536)
    assert(data[0]!.length >= 1)
    assert(data[0]!.length < 65536)

    assert(data.every(line => data[0] && line.length == data[0].length))

    if (!data[0]) throw new Error('malformed data in printRasterBitImage')

    const widthInBytes = Math.ceil(data[0].length / 8)
    const heightInDots = data.length

    const m = ((verticalScale - 1) * 2) + (horizontalScale - 1)

    const a = []

    for (const row of data) {
        for (let i = 0; i < row.length; i += 8) {
            const binary = row.slice(i, i + 8)
                .map(x => x ? 1 : 0)
                .join('')
                .padEnd(8, '0')

            const n = parseInt(binary, 2)

            a.push(n)
        }
    }

    return [GS, 0x76, 0x30, m, ...byteSplit(widthInBytes), ...byteSplit(heightInDots), ...a]
}
