import { EditorGroup, EditorType } from "object-gui";
import type { Container } from "tsparticles-core";
import type { IOpacity } from "tsparticles-core/dist/Options/Interfaces/Particles/Opacity/IOpacity";
import { EditorBase } from "../../../../EditorBase";

export class OpacityOptionsEditor extends EditorBase {
    public group!: EditorGroup;
    private options!: IOpacity;

    constructor(particles: Container) {
        super(particles);
    }

    public addToGroup(parent: EditorGroup, options?: unknown): void {
        this.group = parent.addGroup("opacity", "Opacity", true, options);
        this.options = this.group.data as IOpacity;

        this.addAnimation();
        this.addRandom();
        this.addProperties();
    }

    private addAnimation(): void {
        const particles = this.particles;
        const group = this.group.addGroup("animation", "Animation");

        group.addProperty("enable", "Enable", EditorType.boolean).change(async () => {
            await particles.refresh();
        });

        group
            .addProperty("minimumValue", "Minimum Value", EditorType.number)
            .change(async () => {
                await particles.refresh();
            })
            .min(0)
            .max(0)
            .step(0.01);

        group
            .addProperty("speed", "Speed", EditorType.number)
            .change(async () => {
                await particles.refresh();
            })
            .step(0.01);

        group.addProperty("sync", "Sync", EditorType.boolean).change(async () => {
            await particles.refresh();
        });
    }

    private addRandom(): void {
        const particles = this.particles;
        const group = this.group.addGroup("random", "Random");

        group.addProperty("enable", "Enable", EditorType.boolean).change(async () => {
            await particles.refresh();
        });

        group.addProperty("minimumValue", "Minimum Value", EditorType.number).change(async () => {
            await particles.refresh();
        });
    }

    private addProperties(): void {
        const particles = this.particles;

        this.group
            .addProperty("value", "Value", EditorType.number)
            .change(async () => {
                await particles.refresh();
            })
            .min(0)
            .max(1)
            .step(0.01);
    }
}
