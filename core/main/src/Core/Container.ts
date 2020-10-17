/**
 * [[include:Container.md]]
 * @packageDocumentation
 */
import { Canvas } from "./Canvas";
import type { IRepulse } from "./Interfaces/IRepulse";
import type { IBubble } from "./Interfaces/IBubble";
import type { IContainerInteractivity } from "./Interfaces/IContainerInteractivity";
import { Particles } from "./Particles";
import { Retina } from "./Retina";
import type { IOptions } from "../Options/Interfaces/IOptions";
import { FrameManager } from "./FrameManager";
import type { RecursivePartial } from "../Types";
import { Options } from "../Options/Classes/Options";
import type { IContainerPlugin } from "./Interfaces/IContainerPlugin";
import type { IShapeDrawer } from "./Interfaces/IShapeDrawer";
import { animate, cancelAnimation } from "../Utils";
import { Particle } from "./Particle";
import type { INoiseValue } from "./Interfaces/INoiseValue";
import type { INoise } from "./Interfaces/INoise";
import type { IRgb } from "./Interfaces/Colors";
import type { IAttract } from "./Interfaces/IAttract";
import { Plugins } from "./Plugins";
import { EventListeners } from "./EventListeners";

/**
 * The object loaded into an HTML element, it'll contain options loaded and all data to let everything working
 * [[include:Container.md]]
 * @category Core
 */
export class Container {
    /**
     * Check if the particles container is started
     */
    public started;

    /**
     * Check if the particles container is destroyed, if so it's not recommended using it
     */
    public destroyed;

    public density;
    public pageHidden;
    public lastFrameTime;
    public fpsLimit;
    public interactivity: IContainerInteractivity;
    public bubble: IBubble;
    public repulse: IRepulse;
    public attract: IAttract;

    /**
     * The options used by the container, it's a full [[Options]] object
     */
    public readonly options;

    public readonly retina;
    public readonly canvas;

    /**
     * The particles manager
     */
    public readonly particles;

    public readonly drawer;

    /**
     * All the shape drawers used by the container
     */
    public readonly drawers;

    /**
     * All the plugins used by the container
     */
    public readonly plugins;

    public readonly noise: INoise;

    private paused;
    private firstStart;
    private drawAnimationFrame?: number;

    private readonly eventListeners;
    private readonly intersectionObserver?;

    /**
     * This is the core class, create an instance to have a new working particles manager
     * @constructor
     * @param id the id to identify this instance
     * @param sourceOptions the options to load
     * @param presets all the presets to load with options
     */
    constructor(
        public readonly id: string,
        public readonly sourceOptions?: RecursivePartial<IOptions>,
        ...presets: string[]
    ) {
        this.firstStart = true;
        this.started = false;
        this.destroyed = false;
        this.paused = true;
        this.lastFrameTime = 0;
        this.pageHidden = false;
        this.retina = new Retina(this);
        this.canvas = new Canvas(this);
        this.particles = new Particles(this);
        this.drawer = new FrameManager(this);
        this.noise = {
            generate: (): INoiseValue => {
                return {
                    angle: Math.random() * Math.PI * 2,
                    length: Math.random(),
                };
            },
            init: (): void => {
                // nothing required
            },
            update: (): void => {
                // nothing required
            },
        };
        this.interactivity = {
            mouse: {
                clicking: false,
                inside: false,
            },
        };
        this.bubble = {};
        this.repulse = { particles: [] };
        this.attract = { particles: [] };
        this.plugins = new Map<string, IContainerPlugin>();
        this.drawers = new Map<string, IShapeDrawer>();
        this.density = 1;
        /* tsParticles variables with default values */
        this.options = new Options();

        for (const preset of presets) {
            this.options.load(Plugins.getPreset(preset));
        }

        const shapes = Plugins.getSupportedShapes();

        for (const type of shapes) {
            const drawer = Plugins.getShapeDrawer(type);

            if (drawer) {
                this.drawers.set(type, drawer);
            }
        }

        /* options settings */
        if (this.sourceOptions) {
            this.options.load(this.sourceOptions);
        }

        this.fpsLimit = this.options.fpsLimit > 0 ? this.options.fpsLimit : 60;

        this.options.setTheme(undefined);

        /* ---------- tsParticles - start ------------ */
        this.eventListeners = new EventListeners(this);

        if (typeof IntersectionObserver !== "undefined" && IntersectionObserver) {
            this.intersectionObserver = new IntersectionObserver((entries) => this.intersectionManager(entries));
        }
    }

    /**
     * Starts animations and resume from pause
     * @param force
     */
    public play(force?: boolean): void {
        const needsUpdate = this.paused || force;

        if (this.firstStart && !this.options.autoPlay) {
            this.firstStart = false;
            return;
        }

        if (this.paused) {
            this.paused = false;
        }

        if (needsUpdate) {
            for (const [, plugin] of this.plugins) {
                if (plugin.play) {
                    plugin.play();
                }
            }

            this.lastFrameTime = performance.now();
        }

        this.draw();
    }

    /**
     * Pauses animations
     */
    public pause(): void {
        if (this.drawAnimationFrame !== undefined) {
            cancelAnimation()(this.drawAnimationFrame);

            delete this.drawAnimationFrame;
        }

        if (this.paused) {
            return;
        }

        for (const [, plugin] of this.plugins) {
            if (plugin.pause) {
                plugin.pause();
            }
        }

        if (!this.pageHidden) {
            this.paused = true;
        }
    }

    /**
     * Draws a frame
     */
    public draw(): void {
        this.drawAnimationFrame = animate()((timestamp) => this.drawer.nextFrame(timestamp));
    }

    /**
     * Gets the animation status
     * @returns `true` is playing, `false` is paused
     */
    public getAnimationStatus(): boolean {
        return !this.paused;
    }

    /**
     * Customise noise generation
     * @param noiseOrGenerator the [[INoise]] object or a function that generates a [[INoiseValue]] object from [[Particle]]
     * @param init the [[INoise]] init function, if the first parameter is a generator function
     * @param update the [[INoise]] update function, if the first parameter is a generator function
     */
    public setNoise(
        noiseOrGenerator?: INoise | ((particle: Particle) => INoiseValue),
        init?: () => void,
        update?: () => void
    ): void {
        if (!noiseOrGenerator) {
            return;
        }

        if (typeof noiseOrGenerator === "function") {
            this.noise.generate = noiseOrGenerator;

            if (init) {
                this.noise.init = init;
            }

            if (update) {
                this.noise.update = update;
            }
        } else {
            if (noiseOrGenerator.generate) {
                this.noise.generate = noiseOrGenerator.generate;
            }

            if (noiseOrGenerator.init) {
                this.noise.init = noiseOrGenerator.init;
            }

            if (noiseOrGenerator.update) {
                this.noise.update = noiseOrGenerator.update;
            }
        }
    }

    /* ---------- tsParticles functions - vendors ------------ */

    /**
     * Aligns particles number to the specified density in the current canvas size
     */
    public densityAutoParticles(): void {
        if (!this.options.particles.number.density.enable) {
            return;
        }

        this.initDensityFactor();

        const numberOptions = this.options.particles.number;
        const optParticlesNumber = numberOptions.value;
        const optParticlesLimit = numberOptions.limit > 0 ? numberOptions.limit : optParticlesNumber;
        const particlesNumber = Math.min(optParticlesNumber, optParticlesLimit) * this.density;
        const particlesCount = this.particles.count;

        if (particlesCount < particlesNumber) {
            this.particles.push(Math.abs(particlesNumber - particlesCount));
        } else if (particlesCount > particlesNumber) {
            this.particles.removeQuantity(particlesCount - particlesNumber);
        }
    }

    /**
     * Destroys the current container, invalidating it
     */
    public destroy(): void {
        this.stop();

        this.canvas.destroy();

        for (const [, drawer] of this.drawers) {
            if (drawer.destroy) {
                drawer.destroy(this);
            }
        }

        for (const key of this.drawers.keys()) {
            this.drawers.delete(key);
        }

        this.destroyed = true;
    }

    /**
     * @deprecated this method is deprecated, please use the exportImage method
     * @param callback The callback to handle the image
     */
    public exportImg(callback: BlobCallback): void {
        this.exportImage(callback);
    }

    /**
     * Exports the current canvas image, `background` property of `options` won't be rendered because it's css related
     * @param callback The callback to handle the image
     * @param type The exported image type
     * @param quality The exported image quality
     */
    public exportImage(callback: BlobCallback, type?: string, quality?: number): void {
        return this.canvas.element?.toBlob(callback, type ?? "image/png", quality);
    }

    /**
     * Exports the current configuration using `options` property
     * @returns a JSON string created from `options` property
     */
    public exportConfiguration(): string {
        return JSON.stringify(this.options, undefined, 2);
    }

    /**
     * Restarts the container, just a [[stop]]/[[start]] alias
     */
    public async refresh(): Promise<void> {
        /* restart */
        this.stop();
        await this.start();
    }

    /**
     * Stops the container, opposite to `start`. Clears some resources and stops events.
     */
    public stop(): void {
        if (!this.started) {
            return;
        }

        this.firstStart = true;
        this.started = false;
        this.eventListeners.removeListeners();
        this.pause();
        this.particles.clear();
        this.canvas.clear();

        if (this.interactivity.element instanceof HTMLElement && this.intersectionObserver) {
            this.intersectionObserver.observe(this.interactivity.element);
        }

        for (const [, plugin] of this.plugins) {
            if (plugin.stop) {
                plugin.stop();
            }
        }

        for (const key of this.plugins.keys()) {
            this.plugins.delete(key);
        }

        this.particles.linksColors = new Map<string, IRgb | string | undefined>();

        delete this.particles.grabLineColor;
        delete this.particles.linksColor;
    }

    /**
     * Loads the given theme, overriding the options
     * @param name the theme name, if `undefined` resets the default options or the default theme
     */
    public async loadTheme(name?: string): Promise<void> {
        this.options.setTheme(name);

        await this.refresh();
    }

    /**
     * Starts the container, initializes what are needed to create animations and event handling
     */
    public async start(): Promise<void> {
        if (this.started) {
            return;
        }

        await this.init();

        this.started = true;

        this.eventListeners.addListeners();

        if (this.interactivity.element instanceof HTMLElement && this.intersectionObserver) {
            this.intersectionObserver.observe(this.interactivity.element);
        }

        for (const [, plugin] of this.plugins) {
            if (plugin.startAsync !== undefined) {
                await plugin.startAsync();
            } else if (plugin.start !== undefined) {
                plugin.start();
            }
        }

        this.play();
    }

    private async init(): Promise<void> {
        /* init canvas + particles */
        this.retina.init();
        this.canvas.init();

        this.fpsLimit = this.options.fpsLimit > 0 ? this.options.fpsLimit : 60;

        const availablePlugins = Plugins.getAvailablePlugins(this);

        for (const [id, plugin] of availablePlugins) {
            this.plugins.set(id, plugin);
        }

        for (const [, drawer] of this.drawers) {
            if (drawer.init) {
                await drawer.init(this);
            }
        }

        for (const [, plugin] of this.plugins) {
            if (plugin.init) {
                plugin.init(this.options);
            } else if (plugin.initAsync !== undefined) {
                await plugin.initAsync(this.options);
            }
        }

        this.canvas.windowResize();
        this.particles.init();
    }

    private initDensityFactor(): void {
        const densityOptions = this.options.particles.number.density;

        if (!this.canvas.element || !densityOptions.enable) {
            return;
        }

        const canvas = this.canvas.element;
        const pxRatio = this.retina.pixelRatio;

        this.density =
            (canvas.width * canvas.height) / (densityOptions.factor * pxRatio * pxRatio * densityOptions.area);
    }

    private intersectionManager(entries: IntersectionObserverEntry[]) {
        if (!this.options.pauseOnOutsideViewport) {
            return;
        }

        for (const entry of entries) {
            if (entry.target !== this.interactivity.element) {
                continue;
            }

            if (entry.isIntersecting) {
                this.play();
            } else {
                this.pause();
            }
        }
    }
}
