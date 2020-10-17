import type { Container } from "tsparticles-core/dist/Core/Container";
import type { ICoordinates } from "tsparticles-core/dist/Core/Interfaces/ICoordinates";
import type { IEmitter } from "./Options/Interfaces/IEmitter";
import { SizeMode } from "tsparticles-core/dist/Enums";
import { EmitterSize } from "./Options/Classes/EmitterSize";
import type { Emitters } from "./Emitters";
import type { RecursivePartial } from "tsparticles-core/dist/Types";
import type { IParticles } from "tsparticles-core/dist/Options/Interfaces/Particles/IParticles";
import type { IEmitterSize } from "./Options/Interfaces/IEmitterSize";
import { deepExtend, isPointInside } from "tsparticles-core";

/**
 * @category Emitters Plugin
 */
export class EmitterInstance {
    public position: ICoordinates;
    public size: IEmitterSize;
    public emitterOptions: IEmitter;

    private lifeCount;

    private startInterval?: number;

    private readonly immortal;

    private readonly initialPosition?: ICoordinates;
    private readonly particlesOptions: RecursivePartial<IParticles>;

    constructor(
        private readonly emitters: Emitters,
        private readonly container: Container,
        emitterOptions: IEmitter,
        position?: ICoordinates
    ) {
        this.initialPosition = position;
        this.emitterOptions = deepExtend({}, emitterOptions) as IEmitter;
        this.position = this.initialPosition ?? this.calcPosition();

        let particlesOptions = deepExtend({}, this.emitterOptions.particles) as RecursivePartial<IParticles>;

        if (particlesOptions === undefined) {
            particlesOptions = {};
        }

        if (particlesOptions.move === undefined) {
            particlesOptions.move = {};
        }

        if (particlesOptions.move.direction === undefined) {
            particlesOptions.move.direction = this.emitterOptions.direction;
        }

        this.particlesOptions = particlesOptions;

        this.size =
            this.emitterOptions.size ??
            ((): IEmitterSize => {
                const size = new EmitterSize();

                size.load({
                    height: 0,
                    mode: SizeMode.percent,
                    width: 0,
                });

                return size;
            })();

        this.lifeCount = this.emitterOptions.life.count ?? -1;
        this.immortal = this.lifeCount <= 0;

        this.play();
    }

    public play(): void {
        if (
            this.container.retina.reduceFactor &&
            (this.lifeCount > 0 || this.immortal || !this.emitterOptions.life.count)
        ) {
            if (this.startInterval === undefined) {
                const delay = (1000 * this.emitterOptions.rate.delay) / this.container.retina.reduceFactor;

                this.startInterval = window.setInterval(() => {
                    this.emit();
                }, delay);
            }

            if (this.lifeCount > 0 || this.immortal) {
                this.prepareToDie();
            }
        }
    }

    public pause(): void {
        const interval = this.startInterval;

        if (interval !== undefined) {
            clearInterval(interval);

            delete this.startInterval;
        }
    }

    public resize(): void {
        const initialPosition = this.initialPosition;

        this.position =
            initialPosition && isPointInside(initialPosition, this.container.canvas.size)
                ? initialPosition
                : this.calcPosition();
    }

    private prepareToDie(): void {
        const duration = this.emitterOptions.life?.duration;

        if (
            this.container.retina.reduceFactor &&
            (this.lifeCount > 0 || this.immortal) &&
            duration !== undefined &&
            duration > 0
        ) {
            window.setTimeout(() => {
                this.pause();

                if (!this.immortal) {
                    this.lifeCount--;
                }

                if (this.lifeCount > 0 || this.immortal) {
                    this.position = this.calcPosition();

                    window.setTimeout(() => {
                        this.play();
                    }, ((this.emitterOptions.life.delay ?? 0) * 1000) / this.container.retina.reduceFactor);
                } else {
                    this.destroy();
                }
            }, duration * 1000);
        }
    }

    private destroy(): void {
        this.emitters.removeEmitter(this);
    }

    private calcPosition(): ICoordinates {
        const container = this.container;

        const percentPosition = this.emitterOptions.position ?? {
            x: Math.random() * 100,
            y: Math.random() * 100,
        };

        return {
            x: (percentPosition.x / 100) * container.canvas.size.width,
            y: (percentPosition.y / 100) * container.canvas.size.height,
        };
    }

    private emit(): void {
        const container = this.container;
        const position = this.position;
        const offset = {
            x:
                this.size.mode === SizeMode.percent
                    ? (container.canvas.size.width * this.size.width) / 100
                    : this.size.width,
            y:
                this.size.mode === SizeMode.percent
                    ? (container.canvas.size.height * this.size.height) / 100
                    : this.size.height,
        };

        for (let i = 0; i < this.emitterOptions.rate.quantity; i++) {
            container.particles.addParticle(
                {
                    x: position.x + offset.x * (Math.random() - 0.5),
                    y: position.y + offset.y * (Math.random() - 0.5),
                },
                this.particlesOptions
            );
        }
    }
}
