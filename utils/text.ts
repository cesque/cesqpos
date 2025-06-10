export function text(s: string) {
    return s.split('').map(x => x.charCodeAt(0))
}