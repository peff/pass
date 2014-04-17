var fills = [];

function getField(id)
{
  return io.system("pass -n " + escape(id));
}

function fill()
{
  for (i in fills) {
    let doc = window.content.document;
    if (!fills[i][0].test(doc.URL)) continue;
    for (let elem in DOM.XPath('//input', doc)) {
      if (elem.id.match(/user/i)) {
        elem.value = getField(fills[i][1] + ".user");
      }
      else if (elem.id.match(/password/i)) {
        elem.value = getField(fills[i][1] + ".pass");
      }
    }
  }
}

function add(url, root)
{
  fills.push([new RegExp(url), root]);
}
