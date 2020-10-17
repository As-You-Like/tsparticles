import type { Container } from "./Container";
import type { IDimension } from "./Interfaces/IDimension";
import type { IRgb, IRgba } from "./Interfaces/Colors";
import type { ICoordinates } from "./Interfaces/ICoordinates";
import type { IParticle } from "./Interfaces/IParticle";
import type { IContainerPlugin } from "./Interfaces/IContainerPlugin";
import type { ILink } from "./Interfaces/ILink";
import {
    canvasClass,
    clear,
    colorToRgb,
    deepExtend,
    drawConnectLine,
    drawGrabLine,
    drawLight,
    drawLinkLine,
    drawLinkTriangle,
    drawParticle,
    drawParticleShadow,
    drawPlugin,
    getDistance,
    getLinkColor,
    getStyleFromRgb,
    gradient,
    hslToRgb,
    paintBase,
} from "../Utils";
import type { Particle } from "./Particle";
import type { IDelta } from "./Interfaces/IDelta";

/**
 * Canvas manager
 * @category Core
 */
export class Canvas {
    /**
     * The particles canvas
     */
    public element?: HTMLCanvasElement;

    /**
     * The particles canvas dimension
     */
    public readonly size: IDimension;

    /**
     * The particles canvas context
     */
    private context: CanvasRenderingContext2D | null;
    private generatedCanvas;
    private coverColor?: IRgba;
    private trailFillColor?: IRgb;
    private originalStyle?: CSSStyleDeclaration;

    /**
     * Constructor of canvas manager
     * @param container the parent container
     */
    constructor(private readonly container: Container) {
        this.size = {
            height: 0,
            width: 0,
        };

        this.context = null;
        this.generatedCanvas = false;
    }

    /* ---------- tsParticles functions - canvas ------------ */
    /**
     * Initializes the canvas element
     */
    public init(): void {
        this.resize();

        const options = this.container.options;
        const element = this.element;

        if (element) {
            if (options.backgroundMode.enable) {
                this.originalStyle = deepExtend({}, element.style) as CSSStyleDeclaration;

                element.style.position = "fixed";
                element.style.zIndex = options.backgroundMode.zIndex.toString(10);
                element.style.top = "0";
                element.style.left = "0";
                element.style.width = "100%";
                element.style.height = "100%";
            } else {
                element.style.position = this.originalStyle?.position ?? "";
                element.style.zIndex = this.originalStyle?.zIndex ?? "";
                element.style.top = this.originalStyle?.top ?? "";
                element.style.left = this.originalStyle?.left ?? "";
                element.style.width = this.originalStyle?.width ?? "";
                element.style.height = this.originalStyle?.height ?? "";
            }
        }

        const cover = options.backgroundMask.cover;
        const color = cover.color;
        const trail = options.particles.move.trail;

        const coverRgb = colorToRgb(color);

        this.coverColor =
            coverRgb !== undefined
                ? {
                      r: coverRgb.r,
                      g: coverRgb.g,
                      b: coverRgb.b,
                      a: cover.opacity,
                  }
                : undefined;
        this.trailFillColor = colorToRgb(trail.fillColor);

        this.initBackground();
        this.paint();
    }

    public loadCanvas(canvas: HTMLCanvasElement, generatedCanvas?: boolean): void {
        if (!canvas.className) {
            canvas.className = canvasClass;
        }

        if (this.generatedCanvas) {
            this.element?.remove();
        }

        this.generatedCanvas = generatedCanvas ?? this.generatedCanvas;
        this.element = canvas;
        this.originalStyle = deepExtend({}, this.element.style) as CSSStyleDeclaration;
        this.size.height = canvas.offsetHeight;
        this.size.width = canvas.offsetWidth;

        this.context = this.element.getContext("2d");
        this.container.retina.init();
        this.initBackground();
    }

    public destroy(): void {
        if (this.generatedCanvas) {
            this.element?.remove();
        }

        if (this.context) {
            clear(this.context, this.size);
        }
    }

    /**
     * Calculates the size of the canvas
     */
    public resize(): void {
        if (!this.element) {
            return;
        }

        this.element.width = this.size.width;
        this.element.height = this.size.height;
    }

    /**
     * Paints the canvas background
     */
    public paint(): void {
        const options = this.container.options;

        if (!this.context) {
            return;
        }

        if (options.backgroundMask.enable && options.backgroundMask.cover && this.coverColor) {
            clear(this.context, this.size);
            this.paintBase(getStyleFromRgb(this.coverColor, this.coverColor.a));
        } else {
            this.paintBase();
        }
    }

    /**
     * Clears the canvas content
     */
    public clear(): void {
        const options = this.container.options;
        const trail = options.particles.move.trail;

        if (options.backgroundMask.enable) {
            this.paint();
        } else if (trail.enable && trail.length > 0 && this.trailFillColor) {
            this.paintBase(getStyleFromRgb(this.trailFillColor, 1 / trail.length));
        } else if (this.context) {
            clear(this.context, this.size);
        }
    }

    public windowResize(): void {
        if (!this.element) {
            return;
        }

        const container = this.container;
        const options = container.options;
        const pxRatio = container.retina.pixelRatio;

        container.canvas.size.width = this.element.offsetWidth * pxRatio;
        container.canvas.size.height = this.element.offsetHeight * pxRatio;

        this.element.width = container.canvas.size.width;
        this.element.height = container.canvas.size.height;

        /* repaint canvas on anim disabled */
        if (!options.particles.move.enable) {
            container.particles.redraw();
        }

        /* density particles enabled */
        container.densityAutoParticles();

        for (const [, plugin] of container.plugins) {
            if (plugin.resize !== undefined) {
                plugin.resize();
            }
        }
    }

    public drawConnectLine(p1: IParticle, p2: IParticle): void {
        const lineStyle = this.lineStyle(p1, p2);

        if (!lineStyle) {
            return;
        }

        const ctx = this.context;

        if (!ctx) {
            return;
        }

        const pos1 = p1.getPosition();
        const pos2 = p2.getPosition();

        drawConnectLine(ctx, p1.linksWidth ?? this.container.retina.linksWidth, lineStyle, pos1, pos2);
    }

    public drawGrabLine(particle: IParticle, lineColor: IRgb, opacity: number, mousePos: ICoordinates): void {
        const container = this.container;
        const ctx = container.canvas.context;

        if (!ctx) {
            return;
        }

        const beginPos = particle.getPosition();

        drawGrabLine(ctx, particle.linksWidth ?? container.retina.linksWidth, beginPos, mousePos, lineColor, opacity);
    }

    public drawParticleShadow(particle: Particle, mousePos: ICoordinates): void {
        if (!this.context) {
            return;
        }

        drawParticleShadow(this.container, this.context, particle, mousePos);
    }

    public drawLinkTriangle(p1: IParticle, link1: ILink, link2: ILink): void {
        const container = this.container;
        const options = container.options;
        const p2 = link1.destination;
        const p3 = link2.destination;
        const triangleOptions = p1.particlesOptions.links.triangles;
        const opacityTriangle = triangleOptions.opacity ?? (link1.opacity + link2.opacity) / 2;

        if (opacityTriangle <= 0) {
            return;
        }

        const pos1 = p1.getPosition();
        const pos2 = p2.getPosition();
        const pos3 = p3.getPosition();

        const ctx = this.context;

        if (!ctx) {
            return;
        }

        if (
            getDistance(pos1, pos2) > container.retina.linksDistance ||
            getDistance(pos3, pos2) > container.retina.linksDistance ||
            getDistance(pos3, pos1) > container.retina.linksDistance
        ) {
            return;
        }

        let colorTriangle = colorToRgb(triangleOptions.color);

        if (!colorTriangle) {
            const linksOptions = p1.particlesOptions.links;
            const linkColor =
                linksOptions.id !== undefined
                    ? container.particles.linksColors.get(linksOptions.id)
                    : container.particles.linksColor;

            colorTriangle = getLinkColor(p1, p2, linkColor);
        }

        if (!colorTriangle) {
            return;
        }

        drawLinkTriangle(
            ctx,
            pos1,
            pos2,
            pos3,
            options.backgroundMask.enable,
            options.backgroundMask.composite,
            colorTriangle,
            opacityTriangle
        );
    }

    public drawLinkLine(p1: IParticle, link: ILink): void {
        const container = this.container;
        const options = container.options;
        const p2 = link.destination;
        let opacity = link.opacity;
        const pos1 = p1.getPosition();
        const pos2 = p2.getPosition();

        const ctx = this.context;

        if (!ctx) {
            return;
        }

        let colorLine: IRgb | undefined;

        /*
         * particles connecting line color:
         *
         *  random: in blink mode : in every frame refresh the color would change
         *          hence resulting blinking of lines
         *  mid: in consent mode: sample particles color and get a mid level color
         *                        from those two for the connecting line color
         */

        const twinkle = p1.particlesOptions.twinkle.lines;

        if (twinkle.enable) {
            const twinkleFreq = twinkle.frequency;
            const twinkleRgb = colorToRgb(twinkle.color);
            const twinkling = Math.random() < twinkleFreq;

            if (twinkling && twinkleRgb !== undefined) {
                colorLine = twinkleRgb;
                opacity = twinkle.opacity;
            }
        }

        if (!colorLine) {
            const linksOptions = p1.particlesOptions.links;
            const linkColor =
                linksOptions.id !== undefined
                    ? container.particles.linksColors.get(linksOptions.id)
                    : container.particles.linksColor;

            colorLine = getLinkColor(p1, p2, linkColor);
        }

        if (!colorLine) {
            return;
        }

        const width = p1.linksWidth ?? container.retina.linksWidth;
        const maxDistance = p1.linksDistance ?? container.retina.linksDistance;

        drawLinkLine(
            ctx,
            width,
            pos1,
            pos2,
            maxDistance,
            container.canvas.size,
            p1.particlesOptions.links.warp,
            options.backgroundMask.enable,
            options.backgroundMask.composite,
            colorLine,
            opacity,
            p1.particlesOptions.links.shadow
        );
    }

    public drawParticle(particle: Particle, delta: IDelta): void {
        if (particle.image?.loaded === false || particle.spawning || particle.destroyed) {
            return;
        }

        const pfColor = particle.getFillColor();
        const psColor = particle.getStrokeColor() ?? pfColor;

        if (!pfColor && !psColor) {
            return;
        }

        const container = this.container;
        const options = container.options;
        const particles = container.particles;
        const pOptions = particle.particlesOptions;
        const twinkle = pOptions.twinkle.particles;
        const twinkleFreq = twinkle.frequency;
        const twinkleRgb = colorToRgb(twinkle.color);
        const twinkling = twinkle.enable && Math.random() < twinkleFreq;
        const radius = particle.getRadius();
        const opacity = twinkling ? twinkle.opacity : particle.bubble.opacity ?? particle.opacity.value;
        const infectionStage = particle.infecter.infectionStage;
        const infection = options.infection;
        const infectionStages = infection.stages;
        const infectionColor = infectionStage !== undefined ? infectionStages[infectionStage].color : undefined;
        const infectionRgb = colorToRgb(infectionColor);
        const fColor =
            twinkling && twinkleRgb !== undefined
                ? twinkleRgb
                : infectionRgb ?? (pfColor ? hslToRgb(pfColor) : undefined);
        const sColor =
            twinkling && twinkleRgb !== undefined
                ? twinkleRgb
                : infectionRgb ?? (psColor ? hslToRgb(psColor) : undefined);

        const fillColorValue = fColor !== undefined ? getStyleFromRgb(fColor, opacity) : undefined;

        if (!this.context || (!fillColorValue && !sColor)) {
            return;
        }

        const strokeColorValue =
            sColor !== undefined ? getStyleFromRgb(sColor, particle.stroke.opacity ?? opacity) : fillColorValue;

        if (particle.links.length > 0) {
            this.context.save();
            const p1Links = particle.links.filter((l) => {
                const linkFreq = container.particles.getLinkFrequency(particle, l.destination);

                return linkFreq <= pOptions.links.frequency;
            });

            for (const link of p1Links) {
                const p2 = link.destination;

                if (pOptions.links.triangles.enable) {
                    const links = p1Links.map((l) => l.destination);
                    const vertices = p2.links.filter((t) => {
                        const linkFreq = container.particles.getLinkFrequency(p2, t.destination);

                        return linkFreq <= p2.particlesOptions.links.frequency && links.indexOf(t.destination) >= 0;
                    });

                    if (vertices.length) {
                        for (const vertex of vertices) {
                            const p3 = vertex.destination;
                            const triangleFreq = particles.getTriangleFrequency(particle, p2, p3);

                            if (triangleFreq > pOptions.links.triangles.frequency) {
                                continue;
                            }

                            this.drawLinkTriangle(particle, link, vertex);
                        }
                    }
                }

                if (link.opacity > 0 && container.retina.linksWidth > 0) {
                    this.drawLinkLine(particle, link);
                }
            }

            this.context.restore();
        }

        if (radius > 0) {
            drawParticle(
                this.container,
                this.context,
                particle,
                delta,
                fillColorValue,
                strokeColorValue,
                options.backgroundMask.enable,
                options.backgroundMask.composite,
                radius,
                opacity,
                particle.particlesOptions.shadow
            );
        }
    }

    public drawPlugin(plugin: IContainerPlugin, delta: IDelta): void {
        if (!this.context) {
            return;
        }

        drawPlugin(this.context, plugin, delta);
    }

    public drawLight(mousePos: ICoordinates): void {
        if (!this.context) {
            return;
        }

        drawLight(this.container, this.context, mousePos);
    }

    private paintBase(baseColor?: string): void {
        if (!this.context) {
            return;
        }

        paintBase(this.context, this.size, baseColor);
    }

    private lineStyle(p1: IParticle, p2: IParticle): CanvasGradient | undefined {
        const options = this.container.options;
        const connectOptions = options.interactivity.modes.connect;

        if (this.context) {
            return gradient(this.context, p1, p2, connectOptions.links.opacity);
        }
    }

    private initBackground(): void {
        const options = this.container.options;
        const background = options.background;
        const element = this.element;

        if (!element) {
            return;
        }

        const elementStyle = element.style;

        if (background.color) {
            const color = colorToRgb(background.color);

            if (color) {
                elementStyle.backgroundColor = getStyleFromRgb(color, background.opacity);
            }
        }

        if (background.image) {
            elementStyle.backgroundImage = background.image;
        }

        if (background.position) {
            elementStyle.backgroundPosition = background.position;
        }

        if (background.repeat) {
            elementStyle.backgroundRepeat = background.repeat;
        }

        if (background.size) {
            elementStyle.backgroundSize = background.size;
        }
    }
}
