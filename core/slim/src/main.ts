import { SquareDrawer } from "tsparticles-core/dist/ShapeDrawers/SquareDrawer";
import { TextDrawer } from "tsparticles-core/dist/ShapeDrawers/TextDrawer";
import { ImageDrawer } from "tsparticles-core/dist/ShapeDrawers/ImageDrawer";
import { Plugins } from "tsparticles-core/dist/Utils";
import { ShapeType } from "tsparticles-core/dist/Enums/Types";
import { LineDrawer } from "tsparticles-core/dist/ShapeDrawers/LineDrawer";
import { CircleDrawer } from "tsparticles-core/dist/ShapeDrawers/CircleDrawer";
import { TriangleDrawer } from "tsparticles-core/dist/ShapeDrawers/TriangleDrawer";
import { StarDrawer } from "tsparticles-core/dist/ShapeDrawers/StarDrawer";
import { PolygonDrawer } from "tsparticles-core/dist/ShapeDrawers/PolygonDrawer";
import type { IOptions } from "tsparticles-core/dist/Options/Interfaces/IOptions";
import type { Container } from "tsparticles-core/dist/Core/Container";
import { Loader } from "tsparticles-core/dist/Core/Loader";
import type { IShapeDrawer } from "tsparticles-core/dist/Core/Interfaces/IShapeDrawer";
import type {
    ShapeDrawerAfterEffectFunction,
    ShapeDrawerDestroyFunction,
    ShapeDrawerDrawFunction,
    ShapeDrawerInitFunction,
    RecursivePartial,
    SingleOrMultiple,
} from "tsparticles-core/dist/Types";
import type { IPlugin } from "tsparticles-core/dist/Core/Interfaces/IPlugin";
import type { Particle } from "tsparticles-core/dist/Core/Particle";

/**
 * Main class for creating the singleton on window.
 * It's a singleton proxy to the static [[Loader]] class for initializing [[Container]] instances
 * @category Main
 */
export class MainSlim {
    private initialized;

    constructor() {
        this.initialized = false;

        const squareDrawer = new SquareDrawer();
        const textDrawer = new TextDrawer();
        const imageDrawer = new ImageDrawer();

        Plugins.addShapeDrawer(ShapeType.line, new LineDrawer());
        Plugins.addShapeDrawer(ShapeType.circle, new CircleDrawer());
        Plugins.addShapeDrawer(ShapeType.edge, squareDrawer);
        Plugins.addShapeDrawer(ShapeType.square, squareDrawer);
        Plugins.addShapeDrawer(ShapeType.triangle, new TriangleDrawer());
        Plugins.addShapeDrawer(ShapeType.star, new StarDrawer());
        Plugins.addShapeDrawer(ShapeType.polygon, new PolygonDrawer());
        Plugins.addShapeDrawer(ShapeType.char, textDrawer);
        Plugins.addShapeDrawer(ShapeType.character, textDrawer);
        Plugins.addShapeDrawer(ShapeType.image, imageDrawer);
        Plugins.addShapeDrawer(ShapeType.images, imageDrawer);
    }

    /**
     * init method, used by imports
     */
    public init(): void {
        if (!this.initialized) {
            this.initialized = true;
        }
    }

    /**
     * Loads an options object from the provided array to create a [[Container]] object.
     * @param tagId The particles container element id
     * @param options The options array to get the item from
     * @param index If provided gets the corresponding item from the array
     * @returns A Promise with the [[Container]] object created
     */
    public async loadFromArray(
        tagId: string,
        options: RecursivePartial<IOptions>[],
        index?: number
    ): Promise<Container | undefined> {
        return Loader.load(tagId, options, index);
    }

    /**
     * Loads the provided options to create a [[Container]] object.
     * @param tagId The particles container element id
     * @param options The options object to initialize the [[Container]]
     * @returns A Promise with the [[Container]] object created
     */
    public async load(
        tagId: string,
        options: SingleOrMultiple<RecursivePartial<IOptions>>
    ): Promise<Container | undefined> {
        return Loader.load(tagId, options);
    }

    /**
     * Loads the provided option to create a [[Container]] object using the element parameter as a container
     * @param id The particles container id
     * @param element The dom element used to contain the particles
     * @param options The options object to initialize the [[Container]]
     */
    public async set(
        id: string,
        element: HTMLElement,
        options: RecursivePartial<IOptions>
    ): Promise<Container | undefined> {
        return Loader.set(id, element, options);
    }

    /**
     * Loads the provided json with a GET request. The content will be used to create a [[Container]] object.
     * This method is async, so if you need a callback refer to JavaScript function `fetch`
     * @param tagId the particles container element id
     * @param pathConfigJson the json path (or paths array) to use in the GET request
     * @param index the index of the paths array, if a single path is passed this value is ignored
     * @returns A Promise with the [[Container]] object created
     */
    public loadJSON(
        tagId: string,
        pathConfigJson: SingleOrMultiple<string>,
        index?: number
    ): Promise<Container | undefined> {
        return Loader.loadJSON(tagId, pathConfigJson, index);
    }

    /**
     * Adds an additional click handler to all the loaded [[Container]] objects.
     * @param callback The function called after the click event is fired
     */
    public setOnClickHandler(callback: (e: Event, particles?: Particle[]) => void): void {
        Loader.setOnClickHandler(callback);
    }

    /**
     * All the [[Container]] objects loaded
     * @returns All the [[Container]] objects loaded
     */
    public dom(): Container[] {
        return Loader.dom();
    }

    /**
     * Retrieves a [[Container]] from all the objects loaded
     * @param index The object index
     * @returns The [[Container]] object at specified index, if present or not destroyed, otherwise undefined
     */
    public domItem(index: number): Container | undefined {
        return Loader.domItem(index);
    }

    /**
     * addShape adds shape to tsParticles, it will be available to all future instances created
     * @param shape the shape name
     * @param drawer the shape drawer function or class instance that draws the shape in the canvas
     * @param init Optional: the shape drawer init function, used only if the drawer parameter is a function
     * @param afterEffect Optional: the shape drawer after effect function, used only if the drawer parameter is a function
     * @param destroy Optional: the shape drawer destroy function, used only if the drawer parameter is a function
     */
    public addShape(
        shape: string,
        drawer: IShapeDrawer | ShapeDrawerDrawFunction,
        init?: ShapeDrawerInitFunction,
        afterEffect?: ShapeDrawerAfterEffectFunction,
        destroy?: ShapeDrawerDestroyFunction
    ): void {
        let customDrawer: IShapeDrawer;

        if (typeof drawer === "function") {
            customDrawer = {
                afterEffect: afterEffect,
                destroy: destroy,
                draw: drawer,
                init: init,
            };
        } else {
            customDrawer = drawer;
        }

        Plugins.addShapeDrawer(shape, customDrawer);
    }

    /**
     * addPreset adds preset to tsParticles, it will be available to all future instances created
     * @param preset the preset name
     * @param options the options to add to the preset
     */
    public addPreset(preset: string, options: RecursivePartial<IOptions>): void {
        Plugins.addPreset(preset, options);
    }

    /**
     * addPlugin adds plugin to tsParticles, if an instance needs it it will be loaded
     * @param plugin the plugin implementation of [[IPlugin]]
     */
    public addPlugin(plugin: IPlugin): void {
        Plugins.addPlugin(plugin);
    }
}
