/**
 * @category Utils
 * @packageDocumentation
 */

import type { ICoordinates } from "../Core/Interfaces/ICoordinates";
import { DivMode } from "../Enums";
import type { ICharacterShape } from "../Options/Interfaces/Particles/Shape/ICharacterShape";
import type { IBounds } from "../Core/Interfaces/IBounds";
import type { IDimension } from "../Core/Interfaces/IDimension";
import type { IImage } from "../Core/Interfaces/IImage";
import type { SingleOrMultiple } from "../Types";
import { DivEvent } from "../Options/Classes/Interactivity/Events/DivEvent";
import type { IModeDiv } from "../Options/Interfaces/Interactivity/Modes/IModeDiv";
import { OutModeDirection } from "../Enums/Directions/OutModeDirection";
import { IParticle } from "../Core/Interfaces/IParticle";
import { ISideData } from "../Core/Interfaces/ISideData";
import { IRectSideResult } from "../Core/Interfaces/IRectSideResult";
import { ICircleBouncer } from "../Core/Interfaces/ICircleBouncer";
import { collisionVelocity, getValue, rotateVelocity } from "./NumberUtils";

type CSSOMString = string;
type FontFaceLoadStatus = "unloaded" | "loading" | "loaded" | "error";
type FontFaceSetStatus = "loading" | "loaded";

interface FontFace {
    family: CSSOMString;
    style: CSSOMString;
    weight: CSSOMString;
    stretch: CSSOMString;
    unicodeRange: CSSOMString;
    variant: CSSOMString;
    featureSettings: CSSOMString;
    variationSettings: CSSOMString;
    display: CSSOMString;
    readonly status: FontFaceLoadStatus;
    readonly loaded: Promise<FontFace>;

    load(): Promise<FontFace>;
}

interface FontFaceSet {
    readonly status: FontFaceSetStatus;
    readonly ready: Promise<FontFaceSet>;

    check(font: string, text?: string): boolean;

    load(font: string, text?: string): Promise<FontFace[]>;
}

declare global {
    interface Document {
        fonts: FontFaceSet;
    }

    interface Window {
        customRequestAnimationFrame: (callback: FrameRequestCallback) => number;
        mozRequestAnimationFrame: (callback: FrameRequestCallback) => number;
        oRequestAnimationFrame: (callback: FrameRequestCallback) => number;
        msRequestAnimationFrame: (callback: FrameRequestCallback) => number;
        customCancelRequestAnimationFrame: (handle: number) => void;
        webkitCancelRequestAnimationFrame: (handle: number) => void;
        mozCancelRequestAnimationFrame: (handle: number) => void;
        oCancelRequestAnimationFrame: (handle: number) => void;
        msCancelRequestAnimationFrame: (handle: number) => void;
        Path2D?: Path2D;
    }
}

/* ---------- global functions - vendors ------------ */
export function isSsr(): boolean {
    return typeof window === "undefined" || !window;
}

export function animate(): (callback: FrameRequestCallback) => number {
    return isSsr()
        ? (callback: FrameRequestCallback): number => setTimeout(callback)
        : (callback: FrameRequestCallback): number =>
              (
                  window.requestAnimationFrame ||
                  window.webkitRequestAnimationFrame ||
                  window.mozRequestAnimationFrame ||
                  window.oRequestAnimationFrame ||
                  window.msRequestAnimationFrame ||
                  window.setTimeout
              )(callback);
}

export function cancelAnimation(): (handle: number) => void {
    return isSsr()
        ? (handle: number): void => clearTimeout(handle)
        : (handle: number): void =>
              (
                  window.cancelAnimationFrame ||
                  window.webkitCancelRequestAnimationFrame ||
                  window.mozCancelRequestAnimationFrame ||
                  window.oCancelRequestAnimationFrame ||
                  window.msCancelRequestAnimationFrame ||
                  window.clearTimeout
              )(handle);
}

/**
 * Check if a value is equal to the destination, if same type, or is in the provided array
 * @param value the value to check
 * @param array the data array or single value
 */
export function isInArray<T>(value: T, array: SingleOrMultiple<T>): boolean {
    return value === array || (array instanceof Array && array.indexOf(value) > -1);
}

export async function loadFont(character: ICharacterShape): Promise<void> {
    try {
        await document.fonts.load(`${character.weight} 36px '${character.font}'`);
    } catch {
        // ignores any error
    }
}

export function arrayRandomIndex<T>(array: T[]): number {
    return Math.floor(Math.random() * array.length);
}

export function itemFromArray<T>(array: T[], index?: number, useIndex = true): T {
    const fixedIndex = index !== undefined && useIndex ? index % array.length : arrayRandomIndex(array);

    return array[fixedIndex];
}

export function isPointInside(
    point: ICoordinates,
    size: IDimension,
    radius?: number,
    direction?: OutModeDirection
): boolean {
    return areBoundsInside(calculateBounds(point, radius ?? 0), size, direction);
}

export function areBoundsInside(bounds: IBounds, size: IDimension, direction?: OutModeDirection): boolean {
    let inside = true;

    if (!direction || direction === OutModeDirection.bottom) {
        inside = bounds.top < size.height;
    }

    if (inside && (!direction || direction === OutModeDirection.left)) {
        inside = bounds.right > 0;
    }

    if (inside && (!direction || direction === OutModeDirection.right)) {
        inside = bounds.left < size.width;
    }

    if (inside && (!direction || direction === OutModeDirection.top)) {
        inside = bounds.bottom > 0;
    }

    return inside;
}

export function calculateBounds(point: ICoordinates, radius: number): IBounds {
    return {
        bottom: point.y + radius,
        left: point.x - radius,
        right: point.x + radius,
        top: point.y - radius,
    };
}

export function loadImage(source: string): Promise<IImage> {
    return new Promise(
        (resolve: (value?: IImage | PromiseLike<IImage> | undefined) => void, reject: (reason?: string) => void) => {
            if (!source) {
                reject("Error tsParticles - No image.src");
                return;
            }

            const image: IImage = {
                source: source,
                type: source.substr(source.length - 3),
            };

            const img = new Image();

            img.addEventListener("load", () => {
                image.element = img;

                resolve(image);
            });

            img.addEventListener("error", () => {
                reject(`Error tsParticles - loading image: ${source}`);
            });

            img.src = source;
        }
    );
}

export async function downloadSvgImage(source: string): Promise<IImage> {
    if (!source) {
        throw new Error("Error tsParticles - No image.src");
    }

    const image: IImage = {
        source: source,
        type: source.substr(source.length - 3),
    };

    if (image.type !== "svg") {
        return loadImage(source);
    }

    const response = await fetch(image.source);

    if (!response.ok) {
        throw new Error("Error tsParticles - Image not found");
    }

    image.svgData = await response.text();

    return image;
}

export function deepExtend(destination: unknown, ...sources: unknown[]): unknown {
    for (const source of sources) {
        if (source === undefined || source === null) {
            continue;
        }

        if (typeof source !== "object") {
            destination = source;

            continue;
        }

        const sourceIsArray = Array.isArray(source);

        if (sourceIsArray && (typeof destination !== "object" || !destination || !Array.isArray(destination))) {
            destination = [];
        } else if (!sourceIsArray && (typeof destination !== "object" || !destination || Array.isArray(destination))) {
            destination = {};
        }

        for (const key in source) {
            if (key === "__proto__") {
                continue;
            }

            const sourceDict = source as Record<string, unknown>;
            const value = sourceDict[key];
            const isObject = typeof value === "object";
            const destDict = destination as Record<string, unknown>;

            destDict[key] =
                isObject && Array.isArray(value)
                    ? value.map((v) => deepExtend(destDict[key], v))
                    : deepExtend(destDict[key], value);
        }
    }
    return destination;
}

export function isDivModeEnabled(mode: DivMode, divs: SingleOrMultiple<DivEvent>): boolean {
    return divs instanceof Array ? !!divs.find((t) => t.enable && isInArray(mode, t.mode)) : isInArray(mode, divs.mode);
}

export function divModeExecute(
    mode: DivMode,
    divs: SingleOrMultiple<DivEvent>,
    callback: (id: string, div: DivEvent) => void
): void {
    if (divs instanceof Array) {
        for (const div of divs) {
            const divMode = div.mode;
            const divEnabled = div.enable;

            if (divEnabled && isInArray(mode, divMode)) {
                singleDivModeExecute(div, callback);
            }
        }
    } else {
        const divMode = divs.mode;
        const divEnabled = divs.enable;

        if (divEnabled && isInArray(mode, divMode)) {
            singleDivModeExecute(divs, callback);
        }
    }
}

export function singleDivModeExecute(div: DivEvent, callback: (selector: string, div: DivEvent) => void): void {
    const selectors = div.selectors;

    if (selectors instanceof Array) {
        for (const selector of selectors) {
            callback(selector, div);
        }
    } else {
        callback(selectors, div);
    }
}

export function divMode<T extends IModeDiv>(divs?: SingleOrMultiple<T>, element?: HTMLElement): T | undefined {
    if (!element || !divs) {
        return;
    }

    if (divs instanceof Array) {
        return divs.find((d) => checkSelector(element, d.selectors));
    } else if (checkSelector(element, divs.selectors)) {
        return divs;
    }
}

export function circleBounceDataFromParticle(p: IParticle): ICircleBouncer {
    return {
        position: p.getPosition(),
        radius: p.getRadius(),
        velocity: p.velocity,
        factor: {
            horizontal: getValue(p.particlesOptions.bounce.horizontal),
            vertical: getValue(p.particlesOptions.bounce.vertical),
        },
    };
}

export function circleBounce(p1: ICircleBouncer, p2: ICircleBouncer): void {
    const xVelocityDiff = p1.velocity.horizontal;
    const yVelocityDiff = p1.velocity.vertical;

    const pos1 = p1.position;
    const pos2 = p2.position;

    const xDist = pos2.x - pos1.x;
    const yDist = pos2.y - pos1.y;

    // Prevent accidental overlap of particles
    if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
        // Grab angle between the two colliding particles
        const angle = -Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);

        // Store mass in var for better readability in collision equation
        const m1 = p1.radius;
        const m2 = p2.radius;

        // Velocity before equation
        const u1 = rotateVelocity(p1.velocity, angle);
        const u2 = rotateVelocity(p2.velocity, angle);

        // Velocity after 1d collision equation
        const v1 = collisionVelocity(u1, u2, m1, m2);
        const v2 = collisionVelocity(u2, u1, m1, m2);

        // Final velocity after rotating axis back to original location
        const vFinal1 = rotateVelocity(v1, -angle);
        const vFinal2 = rotateVelocity(v2, -angle);

        // Swap particle velocities for realistic bounce effect
        p1.velocity.horizontal = vFinal1.horizontal * p1.factor.horizontal;
        p1.velocity.vertical = vFinal1.vertical * p1.factor.vertical;

        p2.velocity.horizontal = vFinal2.horizontal * p2.factor.horizontal;
        p2.velocity.vertical = vFinal2.vertical * p2.factor.vertical;
    }
}

export function rectBounce(particle: IParticle, divBounds: IBounds): void {
    const pPos = particle.getPosition();
    const size = particle.getRadius();
    const bounds = calculateBounds(pPos, size);

    const resH = rectSideBounce(
        {
            min: bounds.left,
            max: bounds.right,
        },
        {
            min: bounds.top,
            max: bounds.bottom,
        },
        {
            min: divBounds.left,
            max: divBounds.right,
        },
        {
            min: divBounds.top,
            max: divBounds.bottom,
        },
        particle.velocity.horizontal,
        getValue(particle.particlesOptions.bounce.horizontal)
    );

    if (resH.bounced) {
        if (resH.velocity !== undefined) {
            particle.velocity.horizontal = resH.velocity;
        }

        if (resH.position !== undefined) {
            particle.position.x = resH.position;
        }
    }

    const resV = rectSideBounce(
        {
            min: bounds.top,
            max: bounds.bottom,
        },
        {
            min: bounds.left,
            max: bounds.right,
        },
        {
            min: divBounds.top,
            max: divBounds.bottom,
        },
        {
            min: divBounds.left,
            max: divBounds.right,
        },
        particle.velocity.vertical,
        getValue(particle.particlesOptions.bounce.vertical)
    );

    if (resV.bounced) {
        if (resV.velocity !== undefined) {
            particle.velocity.vertical = resV.velocity;
        }

        if (resV.position !== undefined) {
            particle.position.y = resV.position;
        }
    }
}

function rectSideBounce(
    pSide: ISideData,
    pOtherSide: ISideData,
    rectSide: ISideData,
    rectOtherSide: ISideData,
    velocity: number,
    factor: number
): IRectSideResult {
    const res: IRectSideResult = { bounced: false };

    if (
        pOtherSide.min >= rectOtherSide.min &&
        pOtherSide.min <= rectOtherSide.max &&
        pOtherSide.max >= rectOtherSide.min &&
        pOtherSide.max <= rectOtherSide.max
    ) {
        if (
            (pSide.max >= rectSide.min && pSide.max <= (rectSide.max + rectSide.min) / 2 && velocity > 0) ||
            (pSide.min <= rectSide.max && pSide.min > (rectSide.max + rectSide.min) / 2 && velocity < 0)
        ) {
            res.velocity = velocity * -factor;

            res.bounced = true;
        }
    }

    return res;
}

function checkSelector(element: HTMLElement, selectors: SingleOrMultiple<string>): boolean {
    if (selectors instanceof Array) {
        for (const selector of selectors) {
            if (element.matches(selector)) {
                return true;
            }
        }

        return false;
    } else {
        return element.matches(selectors);
    }
}
