import type { IAbsorberSize } from "../Interfaces/IAbsorberSize";
import type { RecursivePartial } from "tsparticles-core/dist/Types";
import type { IOptionLoader } from "tsparticles-core/dist/Options/Interfaces/IOptionLoader";
import { ValueWithRandom } from "tsparticles-core/dist/Options/Classes/ValueWithRandom";

export class AbsorberSize extends ValueWithRandom implements IAbsorberSize, IOptionLoader<IAbsorberSize> {
    public density;
    public limit?: number;

    constructor() {
        super();
        this.density = 5;
        this.random.minimumValue = 1;
        this.value = 50;
    }

    public load(data?: RecursivePartial<IAbsorberSize>): void {
        if (!data) {
            return;
        }

        super.load(data);

        if (data.density !== undefined) {
            this.density = data.density;
        }
        if (data.limit !== undefined) {
            this.limit = data.limit;
        }

        if (data.limit !== undefined) {
            this.limit = data.limit;
        }
    }
}
