export function enableHmr (url, appCustomElements) {
  window.createHotContext(url);
  let hmr = window.getHotContext(url);

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
          let oldScrollTop = element.scrollTop;
          let oldScrollLeft = element.scrollLeft;
          element.attachDraw(oldClass.prototype.draw);
          element.draw();
          element.scrollTop = oldScrollTop;
          element.scrollLeft = oldScrollLeft;
        });

      } catch (err) {
        hmr.invalidate();
      }
    });
  }
}
