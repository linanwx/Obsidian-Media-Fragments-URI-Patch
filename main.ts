import { MarkdownRenderChild,Plugin } from 'obsidian';
import { TextFileView, WorkspaceLeaf, TFile, parseLinktext } from "obsidian"
import filetypeinfo from 'magic-bytes.js'

interface ObsidianMFUPatch {
}

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
							context.addChild(new FragmentPatch(span, tmparray[1]))
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
	private fragment: string
	private original: HTMLElement
	private ilObs:MutationObserver

	constructor(containerEl: HTMLElement, fragment: string) {
		super(containerEl);
		this.fragment = fragment
		this.original = containerEl
	}
	async onload(): Promise<void> {
		this.ilObs = new MutationObserver((mutations, observer)=>{
			let audios = this.original.querySelectorAll("audio")
			audios.forEach((el, key, list)=>{
				let src = el.getAttr("src")
				src = src + "#" + this.fragment
				el.setAttr("src", src)
				el.setAttr("onpause", "this.load()")
			})
			let videos = this.original.querySelectorAll("video")
			videos.forEach((el, key, list)=>{
				let src = el.getAttr("src")
				src = src + "#" + this.fragment
				el.setAttr("src", src)
				el.setAttr("onpause", "this.load()")
			})
		})
		this.ilObs.observe(this.original, {attributeFilter: ["class"], attributeOldValue: true })
	}
}