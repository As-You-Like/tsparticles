import { EditorGroup } from "object-gui";
import { Container } from "tsparticles-core";

export abstract class EditorBase {
    protected constructor(protected readonly particles: Container) {}

    public abstract addToGroup(parent: EditorGroup, options?: unknown): void;
}
