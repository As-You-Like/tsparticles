import type { Container } from "tsparticles-core";
import type { IRotate } from "tsparticles-core/dist/Options/Interfaces/Particles/Rotate/IRotate";
import { EditorGroup, EditorType } from "object-gui";
import { EditorBase } from "../../../../EditorBase";
import { RotateDirection } from "tsparticles-core";

export class RotateOptionsEditor extends EditorBase {
    public group!: EditorGroup;
    private options!: IRotate;

    constructor(particles: Container) {
        super(particles);
    }

    public addToGroup(parent: EditorGroup): void {
        this.group = parent.addGroup("rotate", "Rotate");
        this.options = this.group.data as IRotate;

        this.addAnimation();
        this.addProperties();
    }

    private addAnimation(): void {
        const group = this.group.addGroup("animation", "Animation");
        const particles = this.particles;

        group.addProperty("enable", "Enable", EditorType.boolean).change(async () => {
            await particles.refresh();
        });

        group.addProperty("speed", "Speed", EditorType.number).change(async () => {
            await particles.refresh();
        });

        group.addProperty("sync", "Sync", EditorType.boolean).change(async () => {
            await particles.refresh();
        });
    }

    private addProperties(): void {
        const particles = this.particles;

        this.group
            .addProperty("direction", "Direction", EditorType.select)
            .change(async () => {
                await particles.refresh();
            })
            .addItems([
                {
                    value: RotateDirection.clockwise,
                },
                {
                    value: RotateDirection.counterClockwise,
                },
                {
                    value: RotateDirection.random,
                },
            ]);

        this.group.addProperty("path", "Path", EditorType.boolean).change(async () => {
            await particles.refresh();
        });

        this.group.addProperty("random", "Random", EditorType.boolean).change(async () => {
            await particles.refresh();
        });

        this.group.addProperty("value", "Value", EditorType.number).change(async () => {
            await particles.refresh();
        });
    }
}
