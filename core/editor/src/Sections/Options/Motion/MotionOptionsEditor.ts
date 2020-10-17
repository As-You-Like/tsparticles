import type { Container } from "tsparticles-core";
import { EditorGroup, EditorType } from "object-gui";
import { EditorBase } from "../../../EditorBase";
import type { IMotion } from "tsparticles-core/dist/Options/Interfaces/Motion/IMotion";

export class MotionOptionsEditor extends EditorBase {
    private group!: EditorGroup;
    private options!: IMotion;

    constructor(particles: Container) {
        super(particles);
    }

    public addToGroup(parent: EditorGroup): void {
        this.group = parent.addGroup("motion", "Motion");
        this.options = this.group.data as IMotion;

        this.addReduce();
        this.addProperties();
    }

    private addReduce(): void {
        const particles = this.particles;
        const coverGroup = this.group.addGroup("reduce", "Reduce");

        coverGroup
            .addProperty("factor", "Factor", EditorType.number)
            .change(async () => {
                await particles.refresh();
            })
            .step(1);

        coverGroup.addProperty("value", "Value", EditorType.boolean).change(async () => {
            await particles.refresh();
        });
    }

    private addProperties(): void {
        const particles = this.particles;

        this.group.addProperty("disable", "Disable", EditorType.boolean).change(async () => {
            await particles.refresh();
        });
    }
}
