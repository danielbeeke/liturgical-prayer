export const savableSlicer = (paths) => {
  return (state) => {
    let copyState = JSON.parse(JSON.stringify(state));
    delete copyState.app.path;
    return copyState;
  }
};