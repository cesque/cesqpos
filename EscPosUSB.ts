import { usb, findByIds, Device, Endpoint } from 'usb'

type Callback = (e?: any) => void

export default class EscPosUSB {
    device?: Device = undefined
    endpoint?: Endpoint = undefined

    constructor(vid?: number, pid?: number) {
        const tm88iv = {
            vendor: 0x4b8,
            product: 0x202
        }

        this.device = findByIds(
            vid ?? tm88iv.vendor,
            pid ?? tm88iv.product,
        )

        usb.on('detach', device => {
            if (device == this.device) {
                this.device = undefined
            }
        })
    }

    open(callback?: Callback) {
        const cb = callback ?? this.logError

        if (!this.device) {
            cb(new Error(`tried to open device, but device is not set`))
            return
        }

        this.device.open()

        if (!this.device.interfaces) {
            cb(new Error(`selected device has no interfaces to open`))
            return
        }

        for (const iface of this.device.interfaces) {
            try {
                iface.claim()

                const endpoint = iface.endpoints.find(x => x.direction == 'out')

                if (endpoint) {
                    this.endpoint = endpoint
                    cb()
                    break
                }
            } catch (e) {
                cb(e)
            }
        }

        if (!this.endpoint) {
            cb(new Error(`couldn't find endpoint from device`))
        }
    }
    
    write(data: Buffer, callback?: Callback) {
        const cb = callback ?? this.logError

        if (!this.endpoint) {
            cb(new Error(`tried to write, but endpoint is not set`))
            return
        }

        // @ts-ignore idk why transfer isn't set on Endpoint but it DOES exist and it works
        this.endpoint.transfer(data, cb)
    }

    close(callback?: Callback) {
        const cb = callback ?? this.logError

        if (!this.device) {
            cb()
            return
        }

        try {
            this.device.close()
            usb.removeAllListeners('detach')

            cb()
        } catch (e) {
            cb(e)
        }
    }

    logError(e: any) {
        if (e) console.error(e)
    }
}