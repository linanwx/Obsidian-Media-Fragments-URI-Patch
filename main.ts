import { MarkdownRenderChild,Plugin } from 'obsidian';
import { TextFileView, WorkspaceLeaf, TFile, parseLinktext } from "obsidian"
import filetypeinfo from 'magic-bytes.js'

interface ObsidianMFUPatch {
}

export const acceptedExt: Map<string, string[]> = new Map([
	["audio", ["mp3", "wav", "m4a", "ogg", "3gp", "flac"]],
	["video", ["mp4", "ogv"]],
	["media", ["webm"]],
]);

export const getMediaType = (src: TFile): string => {
	let ext = src.extension
	let fileType = "";
	for (const [type, extList] of acceptedExt) {
		if (extList.includes(ext)) fileType = type;
	}
	return fileType;
};

export default class ObsidianMFUPatchPlugin extends Plugin {
	settings: ObsidianMFUPatch;
	async onload() {
		this.registerMarkdownPostProcessor((element, context) => {
			const blocks = element.querySelectorAll('span.internal-embed, div.internal-embed');
			blocks.forEach(async (span, key, parent) => {
				if (span instanceof HTMLElement) {
					let src = span.getAttr("src")
					if (src) {
						let tmparray = src.split("#")
						if (tmparray.length == 2) {
							let path = parseLinktext(src).path
							let file = app.metadataCache.getFirstLinkpathDest(path, context.sourcePath)
							if (file) {
								context.addChild(new FragmentPatch(span, file, tmparray[1]))
							}
						}
					}
				}
			})
		}, 0)
	}
	onunload() {
	}
}

export class FragmentPatch extends MarkdownRenderChild {
	private file: TFile
	private fragment: string
	private original: HTMLElement

	constructor(containerEl: HTMLElement, file: TFile, fragment: string) {
		super(containerEl);
		this.file = file
		this.fragment = fragment
		this.original = containerEl
	}
	async onload(): Promise<void> {
		let mediaType = getMediaType(this.file)
		if (mediaType == "media") {
			let array = await app.vault.readBinary(this.file)
			let guessedFiles = filetypeinfo(new Uint8Array(array,0,100))
			guessedFiles.forEach((guessedfile, index, array)=>{
				if (guessedfile.mime?.includes("audio")) {
					mediaType = "audio"
				}
				if (guessedfile.mime?.includes("video")) {
					mediaType = "video"
				}
			})
		}
		let div = createDiv("div")
		let path = app.vault.getResourcePath(this.file)
		if (mediaType == "audio") {
			let audio = div.createEl(mediaType)
			audio.setAttr("controls", "")
			audio.setAttr("src", path + "#" + this.fragment)
			audio.setAttr("onpause", "this.load()")
		} else if (mediaType == "video") {
			let video = div.createEl(mediaType)
			video.setAttr("controls", "")
			video.setAttr("src", path + "#" + this.fragment)
			video.setAttr("onpause", "this.load()")
		} else {
			return
		}
		this.original.replaceWith(div)
	}
}