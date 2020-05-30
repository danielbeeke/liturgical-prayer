export function observeCurrentPrayer(element) {
  let indicators = element.querySelectorAll('.indicator-item');
  let prayers = element.querySelectorAll('.prayer');

  let options = {
    root: element.querySelector('.slider'),
    rootMargin: '30px',
    threshold: 1
  };

  if (element.route.parameters.category) {
    let activePrayer = element.prayers.find(prayer => prayer.category.slug === element.route.parameters.category);
    let activePrayerIndex = element.prayers.indexOf(activePrayer);
    [...prayers][activePrayerIndex].classList.add('active');
    indicators.forEach((indicator, index) => indicator.classList[index === activePrayerIndex ? 'add' : 'remove']('active'));
    element.querySelector('.slider').children[activePrayerIndex].scrollIntoView();
  }

  let observer = new IntersectionObserver((entries, observer) => {
    let active = [];
    entries.forEach(entry => {
      if (entry.isIntersecting) active.push(entry.target);
    });

    if (active.length > 1) return;

    let activeIndex = [...prayers].indexOf(active[0]);

    prayers.forEach((prayer, index) => prayer.classList[index === activeIndex ? 'add' : 'remove']('active'));
    indicators.forEach((indicator, index) => indicator.classList[index === activeIndex ? 'add' : 'remove']('active'));

    let newUrl = `/pray/${element.route.parameters.moment}/${element.prayers[activeIndex].category.slug}`;
    history.pushState(null,null, newUrl);

  }, options);

  prayers.forEach(prayer => {
    observer.observe(prayer);
  });

  return observer;
}