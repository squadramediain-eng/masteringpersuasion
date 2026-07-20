// SVG files imported as raw strings via webpack asset/source
declare module '*.svg' {
  const content: string;
  export default content;
}
