export const DEFAULT_SEED: string;
export const ART_WIDTH: number;
export const ART_HEIGHT: number;
export const FAVICON_SIZE: number;
export const FAVICON_SIZES: number[];

export function normalizeSeedValue(seedText: string): string;
export function readSeedFromSearch(searchText: string): string;
export function normalizeFaviconSize(sizeValue: string | number | null | undefined): number;
export function generateOgArt(seedText: string): {
  seed: string;
  layoutMode: string;
  svg: string;
  backgroundSvg: string;
};
export function createOgSvg(seedText: string): string;
export function createFaviconSvg(seedText: string): string;
