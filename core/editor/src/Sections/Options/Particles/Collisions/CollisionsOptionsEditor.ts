import { EditorGroup, EditorType } from "object-gui";
import type { Container } from "tsparticles-core";
import type { ICollisions } from "tsparticles-core/dist/Options/Interfaces/Particles/ICollisions";
import { CollisionMode } from "tsparticles-core";
import { EditorBase } from "../../../../EditorBase";

export class CollisionsOptionsEditor extends EditorBase {
    public group!: EditorGroup;
    private options!: ICollisions;

    constructor(particles: Container) {
        super(particles);
    }

    public addToGroup(parent: EditorGroup): void {
        this.group = parent.addGroup("collisions", "Collisions");
        this.options = this.group.data as ICollisions;

        this.addBounce();
        this.addProperties();
    }

    private addBounce(): void {
        const group = this.group.addGroup("bounce", "Bounce");

        this.addBounceFactor(group, "horizontal", "Horizontal");
        this.addBounceFactor(group, "vertical", "Vertical");
    }

    private addBounceFactor(parentGroup: EditorGroup, name: string, title: string): void {
        const particles = this.particles;
        const group = parentGroup.addGroup(name, title);

        const randomGroup = group.addGroup("random", "Random");

        randomGroup.addProperty("enable", "Enable", EditorType.boolean).change(async () => {
            await particles.refresh();
        });

        randomGroup.addProperty("minimumValue", "Minimum Value", EditorType.number).change(async () => {
            await particles.refresh();
        });

        group.addProperty("value", "Value", EditorType.number).change(async () => {
            await particles.refresh();
        });
    }

    private addProperties(): void {
        const particles = this.particles;

        this.group.addProperty("enable", "Enable", EditorType.boolean).change(async () => {
            await particles.refresh();
        });

        this.group
            .addProperty("mode", "Mode", EditorType.select)
            .change(async () => {
                await particles.refresh();
            })
            .addItems([
                {
                    value: CollisionMode.absorb,
                },
                {
                    value: CollisionMode.bounce,
                },
                {
                    value: CollisionMode.destroy,
                },
            ]);
    }
}
