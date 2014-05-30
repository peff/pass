var fills = [];

function getField(id)
{
  return io.system("pass -n " + escape(id));
}

function fillField(elem, id)
{
  elem.focus();
  elem.value = getField(id);
}

function fill()
{
  for (i in fills) {
    let doc = window.content.document;
    if (!fills[i][0].test(doc.URL)) continue;
    for (let elem in DOM.XPath('//input', doc)) {
      if (elem.id.match(/user/i)) {
        fillField(elem, fills[i][1] + ".user");
      }
      else if (elem.type == "password" && elem.id.match(/pass/i)) {
        fillField(elem, fills[i][1] + ".pass");
      }
    }
  }
}

function add(url, root)
{
  fills.push([new RegExp(url), root]);
}
