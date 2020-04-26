function generateUID() {
  let ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rtn = '';
  for (let i = 0; i < 5; i++) {
    rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return rtn;
}

function onEdit(evt) {
  let range = evt.range;
  let sheet = range.getSheet();

  let rangeValues = range.getValues();

  let headers = sheet.getDataRange().offset(0, 0, 1).getValues()[0];
  let headerIdx = headers.indexOf("UniqueID") + 1;

  if (headerIdx !== -1) {
    rangeValues.forEach(function (row, index) {
      let conc = row.join("").length;

      if (conc > 0) {
        let idRange = sheet.getRange(range.getRow() + index, headerIdx);
        let idCell = idRange.getCell(1, 1);
        let idValue = idCell.getValue();
        if (idValue === "") {
          idCell.setValue(generateUID());
        }
      }
    });
  }
}
