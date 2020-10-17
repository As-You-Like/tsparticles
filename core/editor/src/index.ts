import { ParticlesEditor } from "./ParticlesEditor";
import type { Container } from "tsparticles-core";

export function showEditor(container: Container): ParticlesEditor {
    return new ParticlesEditor(container);
}
