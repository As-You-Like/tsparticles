import { tsParticles } from "tsparticles-core";
import type { IParticle } from "tsparticles-core/dist/Core/Interfaces/IParticle";
import type { IShapeValues } from "tsparticles-core/dist/Options/Interfaces/Particles/Shape/IShapeValues";

interface ISpiralData extends IShapeValues {
    innerRadius: number;
    lineSpacing: number;
}

tsParticles.addShape("spiral", function (
    context: CanvasRenderingContext2D,
    particle: IParticle,
    radius: number,
    opacity: number,
    delta: number,
    pixelRatio: number
) {
    const shapeData = particle.shapeData as ISpiralData;

    if (shapeData?.innerRadius === undefined || shapeData.lineSpacing === undefined) {
        return;
    }

    const innerRadius = shapeData.innerRadius * pixelRatio;
    const lineSpacing = shapeData.lineSpacing * pixelRatio;

    const realWidth = (radius - innerRadius) / lineSpacing;

    for (let i = 0; i < realWidth * 10; i++) {
        const angle = 0.1 * i,
            positionFactor = innerRadius + lineSpacing * angle,
            x = positionFactor * Math.cos(angle),
            y = positionFactor * Math.sin(angle);

        context.lineTo(x, y);
    }
});
