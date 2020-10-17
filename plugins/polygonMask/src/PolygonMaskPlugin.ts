import type { IPlugin } from "tsparticles-core/dist/Core/Interfaces/IPlugin";
import { PolygonMaskInstance } from "./PolygonMaskInstance";
import type { Container } from "tsparticles-core/dist/Core/Container";
import type { RecursivePartial } from "tsparticles-core/dist/Types";
import type { IOptions } from "tsparticles-core/dist/Options/Interfaces/IOptions";
import type { IPolygonMaskOptions } from "./Options/Interfaces/IPolygonMaskOptions";
import { Options } from "tsparticles-core/dist/Options/Classes/Options";
import { PolygonMask } from "./Options/Classes/PolygonMask";
import { Type } from "./Enums";

/**
 * @category Polygon Mask Plugin
 */
class PolygonMaskPlugin implements IPlugin {
    public readonly id;

    constructor() {
        this.id = "polygonMask";
    }

    public getPlugin(container: Container): PolygonMaskInstance {
        return new PolygonMaskInstance(container);
    }

    public needsPlugin(options?: RecursivePartial<IOptions & IPolygonMaskOptions>): boolean {
        return options?.polygon?.enable ?? (options?.polygon?.type !== undefined && options.polygon.type !== Type.none);
    }

    public loadOptions(options: Options, source?: RecursivePartial<IOptions & IPolygonMaskOptions>): void {
        if (!this.needsPlugin(source)) {
            return;
        }

        const optionsCast = (options as unknown) as IPolygonMaskOptions;
        let polygonOptions = optionsCast.polygon as PolygonMask;

        if (polygonOptions?.load === undefined) {
            optionsCast.polygon = polygonOptions = new PolygonMask();
        }

        polygonOptions.load(source?.polygon);
    }
}

const plugin = new PolygonMaskPlugin();

export type { IPolygonMaskOptions };
export { plugin as PolygonMaskPlugin };
export * from "./Enums";
