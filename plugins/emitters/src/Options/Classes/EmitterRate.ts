import type { IEmitterRate } from "../Interfaces/IEmitterRate";
import type { RecursivePartial } from "tsparticles-core/dist/Types";
import type { IOptionLoader } from "tsparticles-core/dist/Options/Interfaces/IOptionLoader";

/**
 * @category Emitters Plugin
 */
export class EmitterRate implements IEmitterRate, IOptionLoader<IEmitterRate> {
    public quantity;
    public delay;

    constructor() {
        this.quantity = 1;
        this.delay = 0.1;
    }

    public load(data?: RecursivePartial<IEmitterRate>): void {
        if (data === undefined) {
            return;
        }

        if (data.quantity !== undefined) {
            this.quantity = data.quantity;
        }

        if (data.delay !== undefined) {
            this.delay = data.delay;
        }
    }
}
