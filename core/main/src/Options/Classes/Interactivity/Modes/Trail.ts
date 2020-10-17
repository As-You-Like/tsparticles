import type { ITrail } from "../../../Interfaces/Interactivity/Modes/ITrail";
import type { IParticles } from "../../../Interfaces/Particles/IParticles";
import type { RecursivePartial } from "../../../../Types";
import type { IOptionLoader } from "../../../Interfaces/IOptionLoader";
import { deepExtend } from "../../../../Utils";

/**
 * @category Options
 */
export class Trail implements ITrail, IOptionLoader<ITrail> {
    public delay;
    public particles?: RecursivePartial<IParticles>;
    public quantity;

    constructor() {
        this.delay = 1;
        this.quantity = 1;
    }

    public load(data?: RecursivePartial<ITrail>): void {
        if (data === undefined) {
            return;
        }

        if (data.delay !== undefined) {
            this.delay = data.delay;
        }

        if (data.quantity !== undefined) {
            this.quantity = data.quantity;
        }

        if (data.particles !== undefined) {
            this.particles = deepExtend({}, data.particles) as RecursivePartial<IParticles>;
        }
    }
}
