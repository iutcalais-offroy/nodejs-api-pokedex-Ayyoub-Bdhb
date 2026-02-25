declare module 'yamljs' {
  const YAML: {
    load(path: string): any;
    parse(str: string): any;
  };
  export default YAML;
}
