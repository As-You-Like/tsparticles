/**
 * @category Utils
 * @packageDocumentation
 */

import type { IDimension } from "../Core/Interfaces/IDimension";
import type { ICoordinates } from "../Core/Interfaces/ICoordinates";
import type { IRgb } from "../Core/Interfaces/Colors";
import type { ILinksShadow } from "../Options/Interfaces/Particles/Links/ILinksShadow";
import type { IParticle } from "../Core/Interfaces/IParticle";
import type { IShadow } from "../Options/Interfaces/Particles/IShadow";
import type { Container } from "..";
import type { IContainerPlugin } from "../Core/Interfaces/IContainerPlugin";
import type { IDelta } from "../Core/Interfaces/IDelta";
import { Particle } from "../Core/Particle";
import { colorToRgb, getStyleFromHsl, getStyleFromRgb, mixColors } from "./ColorUtils";
import { getDistance, getDistances } from "./NumberUtils";

export function paintBase(context: CanvasRenderingContext2D, dimension: IDimension, baseColor?: string): void {
    context.save();
    context.fillStyle = baseColor ?? "rgba(0,0,0,0)";
    context.fillRect(0, 0, dimension.width, dimension.height);
    context.restore();
}

export function clear(context: CanvasRenderingContext2D, dimension: IDimension): void {
    context.clearRect(0, 0, dimension.width, dimension.height);
}

export function drawLinkLine(
    context: CanvasRenderingContext2D,
    width: number,
    begin: ICoordinates,
    end: ICoordinates,
    maxDistance: number,
    canvasSize: IDimension,
    warp: boolean,
    backgroundMask: boolean,
    composite: string,
    colorLine: IRgb,
    opacity: number,
    shadow: ILinksShadow
): void {
    // this.ctx.lineCap = "round"; /* performance issue */
    /* path */

    let drawn = false;

    if (getDistance(begin, end) <= maxDistance) {
        drawLine(context, begin, end);

        drawn = true;
    } else if (warp) {
        let pi1: ICoordinates | undefined;
        let pi2: ICoordinates | undefined;

        const endNE = {
            x: end.x - canvasSize.width,
            y: end.y,
        };

        const d1 = getDistances(begin, endNE);

        if (d1.distance <= maxDistance) {
            const yi = begin.y - (d1.dy / d1.dx) * begin.x;

            pi1 = { x: 0, y: yi };
            pi2 = { x: canvasSize.width, y: yi };
        } else {
            const endSW = {
                x: end.x,
                y: end.y - canvasSize.height,
            };

            const d2 = getDistances(begin, endSW);

            if (d2.distance <= maxDistance) {
                const yi = begin.y - (d2.dy / d2.dx) * begin.x;
                const xi = -yi / (d2.dy / d2.dx);

                pi1 = { x: xi, y: 0 };
                pi2 = { x: xi, y: canvasSize.height };
            } else {
                const endSE = {
                    x: end.x - canvasSize.width,
                    y: end.y - canvasSize.height,
                };

                const d3 = getDistances(begin, endSE);

                if (d3.distance <= maxDistance) {
                    const yi = begin.y - (d3.dy / d3.dx) * begin.x;
                    const xi = -yi / (d3.dy / d3.dx);

                    pi1 = { x: xi, y: yi };
                    pi2 = { x: pi1.x + canvasSize.width, y: pi1.y + canvasSize.height };
                }
            }
        }

        if (pi1 && pi2) {
            drawLine(context, begin, pi1);
            drawLine(context, end, pi2);

            drawn = true;
        }
    }

    if (!drawn) {
        return;
    }

    context.lineWidth = width;

    if (backgroundMask) {
        context.globalCompositeOperation = composite;
    }

    context.strokeStyle = getStyleFromRgb(colorLine, opacity);

    if (shadow.enable) {
        const shadowColor = colorToRgb(shadow.color);

        if (shadowColor) {
            context.shadowBlur = shadow.blur;
            context.shadowColor = getStyleFromRgb(shadowColor);
        }
    }

    context.stroke();
}

export function drawLinkTriangle(
    context: CanvasRenderingContext2D,
    pos1: ICoordinates,
    pos2: ICoordinates,
    pos3: ICoordinates,
    backgroundMask: boolean,
    composite: string,
    colorTriangle: IRgb,
    opacityTriangle: number
): void {
    // this.ctx.lineCap = "round"; /* performance issue */
    /* path */

    drawTriangle(context, pos1, pos2, pos3);

    if (backgroundMask) {
        context.globalCompositeOperation = composite;
    }

    context.fillStyle = getStyleFromRgb(colorTriangle, opacityTriangle);

    context.fill();
}

export function drawConnectLine(
    context: CanvasRenderingContext2D,
    width: number,
    lineStyle: CanvasGradient,
    begin: ICoordinates,
    end: ICoordinates
): void {
    context.save();

    drawLine(context, begin, end);

    context.lineWidth = width;
    context.strokeStyle = lineStyle;
    context.stroke();
    context.restore();
}

export function gradient(
    context: CanvasRenderingContext2D,
    p1: IParticle,
    p2: IParticle,
    opacity: number
): CanvasGradient | undefined {
    const gradStop = Math.floor(p2.getRadius() / p1.getRadius());
    const color1 = p1.getFillColor();
    const color2 = p2.getFillColor();

    if (!color1 || !color2) {
        return;
    }

    const sourcePos = p1.getPosition();
    const destPos = p2.getPosition();
    const midRgb = mixColors(color1, color2, p1.getRadius(), p2.getRadius());
    const grad = context.createLinearGradient(sourcePos.x, sourcePos.y, destPos.x, destPos.y);

    grad.addColorStop(0, getStyleFromHsl(color1, opacity));
    grad.addColorStop(gradStop > 1 ? 1 : gradStop, getStyleFromRgb(midRgb, opacity));
    grad.addColorStop(1, getStyleFromHsl(color2, opacity));

    return grad;
}

export function drawGrabLine(
    context: CanvasRenderingContext2D,
    width: number,
    begin: ICoordinates,
    end: ICoordinates,
    colorLine: IRgb,
    opacity: number
): void {
    context.save();

    drawLine(context, begin, end);

    context.strokeStyle = getStyleFromRgb(colorLine, opacity);
    context.lineWidth = width;
    context.stroke();
    context.restore();
}

export function drawLight(container: Container, context: CanvasRenderingContext2D, mousePos: ICoordinates): void {
    const lightOptions = container.options.interactivity.modes.light.area;

    context.beginPath();
    context.arc(mousePos.x, mousePos.y, lightOptions.radius, 0, 2 * Math.PI);

    const gradientAmbientLight = context.createRadialGradient(
        mousePos.x,
        mousePos.y,
        0,
        mousePos.x,
        mousePos.y,
        lightOptions.radius
    );

    const gradient = lightOptions.gradient;
    const gradientRgb = {
        start: colorToRgb(gradient.start),
        stop: colorToRgb(gradient.stop),
    };

    if (!gradientRgb.start || !gradientRgb.stop) {
        return;
    }

    gradientAmbientLight.addColorStop(0, getStyleFromRgb(gradientRgb.start));
    gradientAmbientLight.addColorStop(1, getStyleFromRgb(gradientRgb.stop));
    context.fillStyle = gradientAmbientLight;
    context.fill();
}

export function drawParticleShadow(
    container: Container,
    context: CanvasRenderingContext2D,
    particle: Particle,
    mousePos: ICoordinates
): void {
    const pos = particle.getPosition();
    const shadowOptions = container.options.interactivity.modes.light.shadow;

    context.save();

    const radius = particle.getRadius();
    const sides = particle.sides;
    const full = (Math.PI * 2) / sides;
    const angle = -particle.rotate.value + Math.PI / 4;
    const factor = 1; //Math.sqrt(2);
    const dots = [];

    for (let i = 0; i < sides; i++) {
        dots.push({
            x: pos.x + radius * Math.sin(angle + full * i) * factor,
            y: pos.y + radius * Math.cos(angle + full * i) * factor,
        });
    }

    const points = [];

    const shadowLength = shadowOptions.length;

    for (const dot of dots) {
        const dotAngle = Math.atan2(mousePos.y - dot.y, mousePos.x - dot.x);
        const endX = dot.x + shadowLength * Math.sin(-dotAngle - Math.PI / 2);
        const endY = dot.y + shadowLength * Math.cos(-dotAngle - Math.PI / 2);

        points.push({
            endX: endX,
            endY: endY,
            startX: dot.x,
            startY: dot.y,
        });
    }

    const shadowRgb = colorToRgb(shadowOptions.color);

    if (!shadowRgb) {
        return;
    }

    const shadowColor = getStyleFromRgb(shadowRgb);

    for (let i = points.length - 1; i >= 0; i--) {
        const n = i == points.length - 1 ? 0 : i + 1;

        context.beginPath();

        context.moveTo(points[i].startX, points[i].startY);

        context.lineTo(points[n].startX, points[n].startY);
        context.lineTo(points[n].endX, points[n].endY);
        context.lineTo(points[i].endX, points[i].endY);

        context.fillStyle = shadowColor;

        context.fill();
    }

    context.restore();
}

export function drawParticle(
    container: Container,
    context: CanvasRenderingContext2D,
    particle: IParticle,
    delta: IDelta,
    fillColorValue: string | undefined,
    strokeColorValue: string | undefined,
    backgroundMask: boolean,
    composite: string,
    radius: number,
    opacity: number,
    shadow: IShadow
): void {
    const pos = particle.getPosition();

    context.save();
    context.translate(pos.x, pos.y);
    context.beginPath();

    const angle = particle.rotate.value + (particle.particlesOptions.rotate.path ? particle.pathAngle : 0);

    if (angle !== 0) {
        context.rotate(angle);
    }

    if (backgroundMask) {
        context.globalCompositeOperation = composite;
    }

    const shadowColor = particle.shadowColor;

    if (shadow.enable && shadowColor) {
        context.shadowBlur = shadow.blur;
        context.shadowColor = getStyleFromRgb(shadowColor);
        context.shadowOffsetX = shadow.offset.x;
        context.shadowOffsetY = shadow.offset.y;
    }

    if (fillColorValue) {
        context.fillStyle = fillColorValue;
    }

    const stroke = particle.stroke;

    context.lineWidth = particle.strokeWidth;

    if (strokeColorValue) {
        context.strokeStyle = strokeColorValue;
    }

    drawShape(container, context, particle, radius, opacity, delta);

    if (stroke.width > 0) {
        context.stroke();
    }

    if (particle.close) {
        context.closePath();
    }

    if (particle.fill) {
        context.fill();
    }

    context.restore();

    context.save();
    context.translate(pos.x, pos.y);

    if (angle !== 0) {
        context.rotate(angle);
    }

    if (backgroundMask) {
        context.globalCompositeOperation = composite;
    }

    drawShapeAfterEffect(container, context, particle, radius, opacity, delta);

    context.restore();
}

export function drawShape(
    container: Container,
    context: CanvasRenderingContext2D,
    particle: IParticle,
    radius: number,
    opacity: number,
    delta: IDelta
): void {
    if (!particle.shape) {
        return;
    }

    const drawer = container.drawers.get(particle.shape);

    if (!drawer) {
        return;
    }

    drawer.draw(context, particle, radius, opacity, delta.value, container.retina.pixelRatio);
}

export function drawShapeAfterEffect(
    container: Container,
    context: CanvasRenderingContext2D,
    particle: IParticle,
    radius: number,
    opacity: number,
    delta: IDelta
): void {
    if (!particle.shape) {
        return;
    }

    const drawer = container.drawers.get(particle.shape);

    if (!drawer?.afterEffect) {
        return;
    }

    drawer.afterEffect(context, particle, radius, opacity, delta.value, container.retina.pixelRatio);
}

export function drawPlugin(context: CanvasRenderingContext2D, plugin: IContainerPlugin, delta: IDelta): void {
    if (plugin.draw !== undefined) {
        context.save();
        plugin.draw(context, delta);
        context.restore();
    }
}

function drawLine(context: CanvasRenderingContext2D, begin: ICoordinates, end: ICoordinates): void {
    context.beginPath();
    context.moveTo(begin.x, begin.y);
    context.lineTo(end.x, end.y);
    context.closePath();
}

function drawTriangle(context: CanvasRenderingContext2D, p1: ICoordinates, p2: ICoordinates, p3: ICoordinates): void {
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.lineTo(p3.x, p3.y);
    context.closePath();
}
