export function observeCurrentPrayer(element) {
  let indicators = element.querySelectorAll('.indicator-item');
  let prayers = element.querySelectorAll('.prayer');

  let options = {
    root: element.querySelector('.slider'),
    rootMargin: '30px',
    threshold: .8
  };

  let observer = new IntersectionObserver((entries, observer) => {
    let active = [];
    entries.forEach(entry => {
      if (entry.isIntersecting) active.push(entry.target);
    });

    let activeIndex = [...prayers].indexOf(active[0]);
    indicators.forEach((indicator, index) => indicator.classList[index === activeIndex ? 'add' : 'remove']('active'));
  }, options);

  prayers.forEach(prayer => {
    observer.observe(prayer);
  });
}