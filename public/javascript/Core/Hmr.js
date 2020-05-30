import {createHotContext, getHotContext} from '../../../hmr-client.js';

export function enableHmr (url, appCustomElements) {
  createHotContext(url);
  let hmr = getHotContext(url);

  if (hmr) {
    hmr.accept(({ module }) => {
      try {
        let moduleName = Object.keys(module)[0];
        let item = appCustomElements.find(customElement => customElement.className.name === moduleName);
        let newClass = module[moduleName];
        let oldClass = item.className;

        for (const [propertyName, propertyDescriptor] of Object.entries(Object.getOwnPropertyDescriptors(newClass.prototype))) {
          Reflect.defineProperty(oldClass.prototype, propertyName, propertyDescriptor);
        }

        let elements = document.querySelectorAll(item.tag);
        elements.forEach(element => {
          element.attachDraw(oldClass.prototype.draw);
          element.draw();
        });

      } catch (err) {
        hmr.invalidate();
      }
    });
  }
}
