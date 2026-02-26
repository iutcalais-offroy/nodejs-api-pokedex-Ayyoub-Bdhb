declare module 'yamljs' {
  const YAML: {
    load(path: string): Inconnu;
    parse(str: string): Inconnu;
  };
  export default YAML;
}
