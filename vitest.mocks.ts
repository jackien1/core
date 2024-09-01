/**
 * Copyright (c) 2024 The Diffusion Studio Authors
 *
 * This Source Code Form is subject to the terms of the Mozilla 
 * Public License, v. 2.0 that can be found in the LICENSE file.
 */

import { vi } from 'vitest';

export class FontFaceMock {
	id: string;
	uri: string;
	weight = '';

	constructor(id: string, uri: string) {
		this.id = id;
		this.uri = uri;
	}

	async load() {
		return this;
	}
}

export class FileMock {
	name: string;
	data: Array<any>;
	type: string;

	constructor(data: Array<any>, fileName: string, options?: { type: string }) {
		this.name = fileName;
		this.data = data;
		this.type = options?.type ?? 'video/mp4';
	}

	async arrayBuffer() {
		return new ArrayBuffer(0);
	}

	stream() {
		return {
			pipeTo: async (writable: {
				write: () => Promise<void>;
				close: () => void;
				file: (file: FileMock) => void;
			}) => writable.file(this),
		};
	}
}

export class URLMock {
	href: string;

	constructor(name: string, path: string) {
		this.href = path + '/' + name;
	}

	static createObjectURL(_: Blob | File) {
		return 'blob:chrome://new-tab-page/3dc0f2b7-7773-4cd4-a397-2e43b1bba7cd';
	}
}

export const defaultFetchMockReturnValue = {
	ok: true,
	json: () => new Promise((resolve) => resolve({})),
	arrayBuffer: () => new Promise((resolve) => resolve(new ArrayBuffer(0))),
	blob: () => new Promise((resolve) => resolve(new Blob())),
};

export function setFetchMockReturnValue(response: Partial<Response>) {
	const fetchMock = vi.fn().mockResolvedValue(response);
	Object.assign(globalThis, { fetch: fetchMock });

	return () => {
		const fetchMock = vi.fn().mockResolvedValue(defaultFetchMockReturnValue);
		Object.assign(globalThis, { fetch: fetchMock });
	};
}

export function queryLocalFonts() {
	return [
		{
			family: 'Al Bayan',
			fullName: 'Al Bayan Plain',
			postscriptName: 'AlBayan',
			style: 'Plain',
		},
		{
			family: 'Al Bayan',
			fullName: 'Al Bayan Bold',
			postscriptName: 'AlBayan-Bold',
			style: 'Bold',
		},
		{
			family: 'Al Nile',
			fullName: 'Al Nile',
			postscriptName: 'AlNile',
			style: 'Regular',
		},
		{
			family: 'Al Nile',
			fullName: 'Al Nile Bold',
			postscriptName: 'AlNile-Bold',
			style: 'Bold',
		},
		{
			family: 'Al Tarikh',
			fullName: 'Al Tarikh Regular',
			postscriptName: 'AlTarikh',
			style: 'Regular',
		},
		{
			family: 'American Typewriter',
			fullName: 'American Typewriter',
			postscriptName: 'AmericanTypewriter',
			style: 'Regular',
		},
		{
			family: 'American Typewriter',
			fullName: 'American Typewriter Bold',
			postscriptName: 'AmericanTypewriter-Bold',
			style: 'Bold',
		},
	];
}

export class AudioEncoderMock {
	init: AudioEncoderInit;
	config?: AudioEncoderConfig;
	data: AudioData[] = [];

	public constructor(init: AudioEncoderInit) {
		this.init = init;
	}

	public configure(config: AudioEncoderConfig): void {
		this.config = config;
	}

	public encode(data: AudioData): void {
		this.data.push(data);
	}

	public async flush(): Promise<void> {
		return;
	}
}

export class AudioDataMock {
	init: AudioDataInit;

	constructor(init: AudioDataInit) {
		this.init = init;
	}
}

export class VideoEncoderMock {
	init: VideoEncoderInit;
	config?: VideoEncoderConfig;
	data: { frame: VideoFrame; options?: VideoEncoderEncodeOptions }[] = [];

	ondequeue?(): void;

	public constructor(init: VideoEncoderInit) {
		this.init = init;
	}

	public configure(config: VideoEncoderConfig): void {
		this.config = config;
	}

	public encode(frame: VideoFrame, options?: VideoEncoderEncodeOptions): void {
		this.data.push({ frame, options });
		this.ondequeue?.();
	}

	public static async isConfigSupported(_: VideoEncoderConfig): Promise<VideoEncoderSupport> {
		return {
			supported: true,
		};
	}

	public async flush(): Promise<void> {
		return;
	}
}

export class VideoFrameMock {
	image: CanvasImageSource;
	init?: VideoFrameInit;

	constructor(image: CanvasImageSource, init?: VideoFrameInit) {
		this.image = image;
		this.init = init;
	}

	public close() {
		return;
	}
}


export class FileSystemWritableFileStreamMock {
	data: any;
	fileName: string;

	constructor(data: any, fileName: string) {
		this.data = data;
		this.fileName = fileName;
	}

	async write(data: FileSystemWriteChunkType) {
		this.data[this.fileName] = data;
	}

	async close() { }

	// TODO: Why is this required?
	public file(file: File) {
		Object.assign(file, { name: this.fileName });
		this.data[this.fileName] = file;
	}
}

export class FileSystemFileHandleMock {
	data: any;
	fileName: string;

	constructor(data: any, fileName: string) {
		this.data = data;
		this.fileName = fileName;
	}

	async getFile(): Promise<File> {
		return this.data[this.fileName];
	}

	async remove(): Promise<void> {
		delete this.data[this.fileName];
	}

	async createWritable(): Promise<FileSystemWritableFileStreamMock> {
		return new FileSystemWritableFileStreamMock(this.data, this.fileName);
	}
}

export class FileSystemDirectoryHandleMock {
	data: any = {};
	directory?: string;

	async getDirectoryHandle(name: string, options?: { create: boolean }) {
		if (!(name in this.data) && !options?.create) {
			throw new Error('Directory does not exist');
		}

		if (!(name in this.data)) {
			this.data[name] = {};
		}

		this.directory = name;
		return this;
	}

	async getFileHandle(name: string, options?: { create: boolean }) {
		if (!this.directory) {
			throw new Error('Must get directory handle first');
		}

		if (!(name in this.data[this.directory]) && !options?.create) {
			throw new Error('File does not exist');
		}

		if (!(name in this.data[this.directory])) {
			this.data[this.directory][name] = new File([], '');
		}

		return new FileSystemFileHandleMock(this.data[this.directory], name);
	}

	async remove(_?: { recursive: true }) {
		if (!this.directory) {
			throw new Error('Must get directory handle first');
		}

		delete this.data[this.directory];
	}

	async *keys() {
		if (!this.directory) {
			throw new Error('Must get directory handle first');
		}

		for (const key of Object.keys(this.data[this.directory])) {
			yield key;
		}
	}
}

export const opfs = new FileSystemDirectoryHandleMock();