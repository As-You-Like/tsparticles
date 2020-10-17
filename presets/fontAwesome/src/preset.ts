import { tsParticles } from "tsparticles-core";
import type { ISourceOptions } from "tsparticles-core";
import type { IShapeValues } from "tsparticles-core/dist/Options/Interfaces/Particles/Shape/IShapeValues";

interface ICharacterShape extends IShapeValues {
    font: string;
    style: string;
    weight: string;
}

const characterOptions: ICharacterShape = {
    fill: true,
    font: "Font Awesome 5 Free",
    style: "",
    weight: "400",
};

const data: ISourceOptions = {
    particles: {
        shape: {
            type: "character",
            options: {
                character: characterOptions,
            },
        },
        size: {
            random: false,
            value: 16,
        },
    },
};

tsParticles.addPreset("fontAwesome", data);
tsParticles.addPreset("font-awesome", data);
