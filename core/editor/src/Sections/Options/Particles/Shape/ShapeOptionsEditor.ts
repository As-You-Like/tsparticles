import type { Container } from "tsparticles-core";
import type { IShape } from "tsparticles-core/dist/Options/Interfaces/Particles/Shape/IShape";
import { EditorGroup, EditorType } from "object-gui";
import { EditorBase } from "../../../../EditorBase";

export class ShapeOptionsEditor extends EditorBase {
    public group!: EditorGroup;
    private options!: IShape;

    constructor(particles: Container) {
        super(particles);
    }

    public addToGroup(parent: EditorGroup): void {
        this.group = parent.addGroup("shape", "Shape");
        this.options = this.group.data as IShape;

        this.addProperties();
    }

    private addProperties(): void {
        const particles = this.particles;

        const selectType = this.group.addProperty("type", "Type", EditorType.select).change(async () => {
            await particles.refresh();
        });

        for (const key of particles.drawers.keys()) {
            selectType.addItem(key);
        }
    }
}
