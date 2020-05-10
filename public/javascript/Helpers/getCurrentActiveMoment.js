export function getCurrentActiveMoment(moments) {
  let now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();

  let time = (hour * 60) + minutes;

  let activeMoments = moments.filter(moment => {
    let fromHours = parseInt(moment.from.split(':')[0]);
    let fromMinutes = parseInt(moment.from.split(':')[1]);
    let momentFromTime = (fromHours * 60) + fromMinutes;

    let tillHours = parseInt(moment.till.split(':')[0]);
    let tillMinutes = parseInt(moment.till.split(':')[1]);
    let momentTillTime = (tillHours * 60) + tillMinutes;

    return moment.enabled && time > momentFromTime && time < momentTillTime;
  });

  if (activeMoments) {
    return activeMoments[0];
  }
}