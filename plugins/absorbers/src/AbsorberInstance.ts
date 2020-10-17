import type { ICoordinates } from "tsparticles-core/dist/Core/Interfaces/ICoordinates";
import type { Container } from "tsparticles-core/dist/Core/Container";
import type { Particle } from "tsparticles-core/dist/Core/Particle";
import type { IRgb } from "tsparticles-core/dist/Core/Interfaces/Colors";
import type { IAbsorber } from "./Options/Interfaces/IAbsorber";
import type { Absorbers } from "./Absorbers";
import { colorToRgb, getDistance, getDistances, getStyleFromRgb, getValue, isPointInside } from "tsparticles-core";

type OrbitingParticle = Particle & {
    orbitRadius?: number;
    orbitAngle?: number;
    needsNewPosition?: boolean;
};

/**
 * @category Absorbers Plugin
 */
export class AbsorberInstance {
    public mass;
    public opacity;
    public size;

    public color: IRgb;
    public limit?: number;
    public position: ICoordinates;

    private dragging;

    private readonly initialPosition?: ICoordinates;
    private readonly options: IAbsorber;

    constructor(
        private readonly absorbers: Absorbers,
        private readonly container: Container,
        options: IAbsorber,
        position?: ICoordinates
    ) {
        this.initialPosition = position;
        this.options = options;
        this.dragging = false;

        this.opacity = this.options.opacity;
        this.size = getValue(options.size) * container.retina.pixelRatio;
        this.mass = this.size * options.size.density * container.retina.reduceFactor;

        const limit = options.size.limit;

        this.limit = limit !== undefined ? limit * container.retina.pixelRatio * container.retina.reduceFactor : limit;

        const color = typeof options.color === "string" ? { value: options.color } : options.color;

        this.color = colorToRgb(color) ?? {
            b: 0,
            g: 0,
            r: 0,
        };

        this.position = this.initialPosition ?? this.calcPosition();
    }

    public attract(particle: OrbitingParticle): void {
        const options = this.options;

        if (options.draggable) {
            const mouse = this.container.interactivity.mouse;

            if (mouse.clicking && mouse.downPosition) {
                const mouseDist = getDistance(this.position, mouse.downPosition);

                if (mouseDist <= this.size) {
                    this.dragging = true;
                }
            } else {
                this.dragging = false;
            }

            if (this.dragging && mouse.position) {
                this.position.x = mouse.position.x;
                this.position.y = mouse.position.y;
            }
        }

        const pos = particle.getPosition();
        const { dx, dy, distance } = getDistances(this.position, pos);
        const angle = Math.atan2(dx, dy);
        const acceleration = (this.mass / Math.pow(distance, 2)) * this.container.retina.reduceFactor;

        if (distance < this.size + particle.getRadius()) {
            const sizeFactor = particle.getRadius() * 0.033 * this.container.retina.pixelRatio;

            if (this.size > particle.getRadius() && distance < this.size - particle.getRadius()) {
                if (options.destroy) {
                    particle.destroy();
                } else {
                    particle.needsNewPosition = true;

                    this.updateParticlePosition(particle, angle, acceleration);
                }
            } else {
                if (options.destroy) {
                    particle.size.value -= sizeFactor;
                }

                this.updateParticlePosition(particle, angle, acceleration);
            }

            if (this.limit === undefined || this.size < this.limit) {
                this.size += sizeFactor;
            }

            this.mass += sizeFactor * this.options.size.density * this.container.retina.reduceFactor;
        } else {
            this.updateParticlePosition(particle, angle, acceleration);
        }
    }

    public resize(): void {
        const initialPosition = this.initialPosition;

        this.position =
            initialPosition && isPointInside(initialPosition, this.container.canvas.size)
                ? initialPosition
                : this.calcPosition();
    }

    public draw(context: CanvasRenderingContext2D): void {
        context.translate(this.position.x, this.position.y);
        context.beginPath();
        context.arc(0, 0, this.size, 0, Math.PI * 2, false);
        context.closePath();
        context.fillStyle = getStyleFromRgb(this.color, this.opacity);
        context.fill();
    }

    private calcPosition(): ICoordinates {
        const container = this.container;

        const percentPosition = this.options.position ?? {
            x: Math.random() * 100,
            y: Math.random() * 100,
        };

        return {
            x: (percentPosition.x / 100) * container.canvas.size.width,
            y: (percentPosition.y / 100) * container.canvas.size.height,
        };
    }

    private updateParticlePosition(particle: OrbitingParticle, angle: number, acceleration: number): void {
        if (particle.destroyed) {
            return;
        }

        const canvasSize = this.container.canvas.size;

        if (particle.needsNewPosition) {
            const pSize = particle.getRadius();
            particle.position.x = Math.random() * (canvasSize.width - pSize * 2) + pSize;
            particle.position.y = Math.random() * (canvasSize.height - pSize * 2) + pSize;
            particle.needsNewPosition = false;
        }

        if (this.options.orbits) {
            if (particle.orbitRadius === undefined) {
                particle.orbitRadius = getDistance(particle.getPosition(), this.position);
            }

            if (particle.orbitRadius <= this.size && !this.options.destroy) {
                particle.orbitRadius = Math.random() * Math.max(canvasSize.width, canvasSize.height);
            }

            if (particle.orbitAngle === undefined) {
                particle.orbitAngle = Math.random() * Math.PI * 2;
            }

            const orbitRadius = particle.orbitRadius;
            const orbitAngle = particle.orbitAngle;

            particle.velocity.horizontal = 0;
            particle.velocity.vertical = 0;

            particle.position.x = this.position.x + orbitRadius * Math.cos(orbitAngle);
            particle.position.y = this.position.y + orbitRadius * Math.sin(orbitAngle);

            particle.orbitRadius -= acceleration;
            particle.orbitAngle +=
                ((particle.moveSpeed ?? this.container.retina.moveSpeed) / 100) * this.container.retina.reduceFactor;
        } else {
            particle.velocity.horizontal += Math.sin(angle) * acceleration;
            particle.velocity.vertical += Math.cos(angle) * acceleration;
        }
    }
}
