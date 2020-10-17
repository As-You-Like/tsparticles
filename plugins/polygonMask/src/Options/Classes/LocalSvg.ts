import type { ILocalSvg } from "../Interfaces/ILocalSvg";
import type { SingleOrMultiple } from "tsparticles-core/dist/Types";
import type { IDimension } from "tsparticles-core/dist/Core/Interfaces/IDimension";
import type { RecursivePartial } from "tsparticles-core/dist/Types";
import type { IOptionLoader } from "tsparticles-core/dist/Options/Interfaces/IOptionLoader";

/**
 * @category Polygon Mask Plugin
 */
export class LocalSvg implements ILocalSvg, IOptionLoader<ILocalSvg> {
    public path: SingleOrMultiple<string>;
    public size: IDimension;

    constructor() {
        this.path = [];
        this.size = {
            height: 0,
            width: 0,
        };
    }

    public load(data?: RecursivePartial<ILocalSvg>): void {
        if (data !== undefined) {
            if (data.path !== undefined) {
                this.path = data.path;
            }

            if (data.size !== undefined) {
                if (data.size.width !== undefined) {
                    this.size.width = data.size.width;
                }

                if (data.size.height !== undefined) {
                    this.size.height = data.size.height;
                }
            }
        }
    }
}
