const texts = [
  "mie ayam 12rb",
  "bayar loundry 35rb",
  "cimol 10rb",
  "temen bayar utang 300rb",
  "gaji bulanan 5jt",
  "beli kopi 15.000",
  "parkir 2000"
];

function parseTransactions(input) {
  const parts = input.split(",").map(p => p.trim()).filter(Boolean);
  return parts.map(part => {
    // Regex to capture price at the end or anywhere
    // Match numbers with optional dots, and optional suffixes like rb, ribu, k, jt, juta
    const priceRegex = /((?:\d{1,3}(?:\.\d{3})+|\d+))\s*(rb|ribu|k|jt|juta|m)?\b/i;
    const match = part.match(priceRegex);
    
    let amount = 0;
    let name = part;
    
    if (match) {
      let numStr = match[1].replace(/\./g, '');
      let num = parseFloat(numStr);
      let suffix = match[2] ? match[2].toLowerCase() : '';
      
      if (suffix === 'rb' || suffix === 'ribu' || suffix === 'k') {
        num *= 1000;
      } else if (suffix === 'jt' || suffix === 'juta') {
        num *= 1000000;
      } else if (suffix === 'm') {
        num *= 1000000000;
      }
      
      amount = num;
      // Remove the matched price from the name
      name = part.replace(match[0], '').trim();
    }
    
    return { name, amount };
  });
}

console.log(parseTransactions("mie ayam 12rb, bayar loundry 35rb, cimol 10rb, temen bayar utang 300rb, gaji bulanan 5jt, beli kopi 15.000, parkir 2000"));
