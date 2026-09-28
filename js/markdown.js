function renderMarkdown(source) {
  const lines = String(source).replace(/\r\n/g, "\n").split("\n");
  const html = [];
  const toc = [];
  let section = 0;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function inline(raw) {
    const codes = [];
    let text = escapeHtml(raw).replace(/`([^`]+)`/g, (_, code) => {
      codes.push(code);
      return "\u0000" + (codes.length - 1) + "\u0000";
    });
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    return text.replace(/\u0000(\d+)\u0000/g, (_, index) => "<code>" + codes[index] + "</code>");
  }

  function plain(raw) {
    return raw.replace(/[`*]/g, "").trim();
  }

  function isSpecial(line) {
    return (
      /^```/.test(line) ||
      /^#{1,3}\s+/.test(line) ||
      /^\|/.test(line) ||
      /^>\s?/.test(line) ||
      /^(\s*)[-*]\s+/.test(line) ||
      /^\s*\d+\.\s+/.test(line) ||
      /^ {0,3}(-{3,}|\*{3,})\s*$/.test(line)
    );
  }

  function isSeparator(line) {
    return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  }

  function splitRow(line) {
    let row = line.trim();
    if (row.startsWith("|")) row = row.slice(1);
    if (row.endsWith("|")) row = row.slice(0, -1);
    return row.split("|").map((cell) => cell.trim());
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (/^```/.test(line)) {
      const body = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      html.push("<pre><code>" + escapeHtml(body.join("\n")) + "</code></pre>");
      continue;
    }

    if (/^ {0,3}(-{3,}|\*{3,})\s*$/.test(line)) {
      html.push("<hr>");
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      if (level <= 2) {
        section += 1;
        const id = "task-" + section;
        toc.push({ id, level, text: plain(text) });
        html.push("<h" + level + ' id="' + id + '">' + inline(text) + "</h" + level + ">");
      } else {
        html.push("<h3>" + inline(text) + "</h3>");
      }
      continue;
    }

    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows.push(lines[i]);
        i += 1;
      }
      i -= 1;
      let header = null;
      let body = rows;
      if (rows.length > 1 && isSeparator(rows[1])) {
        header = splitRow(rows[0]);
        body = rows.slice(2);
      }
      const renderCells = (cells, tag) =>
        "<tr>" + cells.map((cell) => "<" + tag + ">" + inline(cell) + "</" + tag + ">").join("") + "</tr>";
      let table = "<div class=\"table-wrap\"><table>";
      if (header && header.some((cell) => cell)) {
        table += "<thead>" + renderCells(header, "th") + "</thead>";
      }
      table += "<tbody>";
      body.forEach((row) => {
        if (!isSeparator(row)) table += renderCells(splitRow(row), "td");
      });
      table += "</tbody></table></div>";
      html.push(table);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      i -= 1;
      html.push("<blockquote><p>" + quote.map(inline).join("<br>") + "</p></blockquote>");
      continue;
    }

    if (/^(\s*)[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      const pattern = ordered ? /^\s*\d+\.\s+/ : /^(\s*)[-*]\s+/;
      while (i < lines.length && pattern.test(lines[i])) {
        items.push(lines[i].replace(pattern, ""));
        i += 1;
      }
      i -= 1;
      const tag = ordered ? "ol" : "ul";
      html.push(
        "<" + tag + ">" + items.map((item) => "<li>" + inline(item) + "</li>").join("") + "</" + tag + ">"
      );
      continue;
    }

    if (!line.trim()) continue;

    const para = [line.trim()];
    while (i + 1 < lines.length && lines[i + 1].trim() && !isSpecial(lines[i + 1])) {
      i += 1;
      para.push(lines[i].trim());
    }
    html.push("<p>" + inline(para.join(" ")) + "</p>");
  }

  return { html: html.join("\n"), toc };
}
