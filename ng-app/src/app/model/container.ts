export class Container {
  name: string;
  selector: string;
  mode: string;
  constructor(name?: string, selector?: string, mode?: string) {
    this.name = name;
    this.selector = selector;
    this.mode = mode;
  }
}
