import { info } from "../logger.js";

export class Fonts {
	static register() {
		info("Registering Fonts...");
		FontConfig.loadFont("CaslonAntique", {
			editor: true,
			fonts: [
				{
					name: "CaslonAntique",
					urls: ["systems/litm/assets/fonts/caslon.ttf"],
				},
				{
					name: "CaslonAntique",
					urls: ["systems/litm/assets/fonts/caslon-b.ttf"],
					weight: "bold",
				},
				{
					name: "CaslonAntique",
					urls: ["systems/litm/assets/fonts/caslon-i.ttf"],
					style: "italic",
				},
			],
		});
		FontConfig.loadFont("LibreCaslonText", {
			editor: true,
			fonts: [
				{
					name: "LibreCaslonText",
					urls: ["systems/litm/assets/fonts/libre-caslon.ttf"],
				},
				{
					name: "LibreCaslonText",
					urls: ["systems/litm/assets/fonts/libre-caslon-i.ttf"],
					style: "italic",
				},
				{
					name: "LibreCaslonText",
					urls: ["systems/litm/assets/fonts/libre-caslon-b.ttf"],
					weight: "bold",
				},
			],
		});
		FontConfig.loadFont("AlchemyItalic", {
			editor: true,
			fonts: [
				{
					name: "AlchemyItalic",
					urls: ["systems/litm/assets/fonts/alchemy-i.ttf"],
				},
			],
		});
		FontConfig.loadFont("PackardAntique", {
			editor: true,
			fonts: [
				{
					name: "PackardAntique",
					urls: ["systems/litm/assets/fonts/packard.ttf"],
				},
				{
					name: "PackardAntique",
					urls: ["systems/litm/assets/fonts/packard-b.ttf"],
					weight: "bold",
				},
			],
		});
	}
}
