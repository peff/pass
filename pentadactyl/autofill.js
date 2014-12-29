function fill()
{
  let doc = window.content.document;
  fields = io.system(["pass", "--autofill", doc.URL]).output.split("\n", 2);
  if (fields.length != 2)
    return;
  for (let elem in DOM.XPath('//input', doc)) {
    if (elem.id.match(/user/i)) {
      elem.focus();
      elem.value = fields[0];
    }
    else if (elem.type == "password" && elem.id.match(/pass/i)) {
      elem.focus();
      elem.value = fields[1];
    }
  }
}
