import type { IDrawStroke } from "./IDrawStroke";
import type { IColor } from "tsparticles-core/dist/Core/Interfaces/Colors";

/**
 * @category Polygon Mask Plugin
 */
export interface IDraw {
    enable: boolean;

    /**
     * @deprecated the property lineColor is deprecated, please use the new stroke.color property
     */
    lineColor: string | IColor;

    /**
     * @deprecated the property lineColor is deprecated, please use the new stroke.width property
     */
    lineWidth: number;

    stroke: IDrawStroke;
}
