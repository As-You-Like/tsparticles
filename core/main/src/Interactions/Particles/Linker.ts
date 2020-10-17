import type { Particle } from "../../Core/Particle";
import type { Container } from "../../Core/Container";
import type { IParticlesInteractor } from "../../Core/Interfaces/IParticlesInteractor";
import { getDistance, getLinkRandomColor } from "../../Utils";
import { Circle, CircleWarp } from "../../Core/QuadTree";
import type { IParticle } from "../../Core/Interfaces/IParticle";

export class Linker implements IParticlesInteractor {
    constructor(private readonly container: Container) {}

    public isEnabled(particle: Particle): boolean {
        return particle.particlesOptions.links.enable;
    }

    public reset(): void {
        // do nothing
    }

    public interact(p1: IParticle): void {
        const container = this.container;
        const linkOpt1 = p1.particlesOptions.links;
        const optOpacity = linkOpt1.opacity;
        const optDistance = p1.linksDistance ?? container.retina.linksDistance;
        const canvasSize = container.canvas.size;
        const warp = linkOpt1.warp;
        const pos1 = p1.getPosition();

        const range = warp
            ? new CircleWarp(pos1.x, pos1.y, optDistance, canvasSize)
            : new Circle(pos1.x, pos1.y, optDistance);

        const query = container.particles.quadTree.query(range);

        for (const p2 of query) {
            const linkOpt2 = p2.particlesOptions.links;

            if (p1 === p2 || !linkOpt2.enable || linkOpt1.id !== linkOpt2.id) {
                continue;
            }

            const pos2 = p2.getPosition();

            let distance = getDistance(pos1, pos2);

            if (warp) {
                if (distance > optDistance) {
                    const pos2NE = {
                        x: pos2.x - canvasSize.width,
                        y: pos2.y,
                    };

                    distance = getDistance(pos1, pos2NE);

                    if (distance > optDistance) {
                        const pos2SE = {
                            x: pos2.x - canvasSize.width,
                            y: pos2.y - canvasSize.height,
                        };

                        distance = getDistance(pos1, pos2SE);

                        if (distance > optDistance) {
                            const pos2SW = {
                                x: pos2.x,
                                y: pos2.y - canvasSize.height,
                            };

                            distance = getDistance(pos1, pos2SW);
                        }
                    }
                }
            }

            if (distance > optDistance) {
                return;
            }

            /* draw a line between p1 and p2 */
            const opacityLine = (1 - distance / optDistance) * optOpacity;
            const linksOptions = p1.particlesOptions.links;

            let linkColor =
                linksOptions.id !== undefined
                    ? container.particles.linksColors.get(linksOptions.id)
                    : container.particles.linksColor;

            if (!linkColor) {
                const optColor = linksOptions.color;

                linkColor = getLinkRandomColor(optColor, linksOptions.blink, linksOptions.consent);

                if (linksOptions.id !== undefined) {
                    container.particles.linksColors.set(linksOptions.id, linkColor);
                } else {
                    container.particles.linksColor = linkColor;
                }
            }

            if (
                p2.links.map((t) => t.destination).indexOf(p1) === -1 &&
                p1.links.map((t) => t.destination).indexOf(p2) === -1
            ) {
                p1.links.push({
                    destination: p2,
                    opacity: opacityLine,
                });
            }
        }
    }
}
