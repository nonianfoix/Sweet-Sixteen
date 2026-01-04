const fs = require('fs');
const path = 'c:/Users/middl/Documents/codex/SWEETSIXTEEN FORK/src/views/RecruitingView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Replace Name Button
// Looking for: <button onClick={() => { setViewingOffersRecruitId(r.id); setViewingOffersStartOfferBuilder(false); }} style={{ ...styles.linkButton, fontWeight: 'bold' }}>
//              {r.name}
//              </button>
// Because of whitespace, we'll try to match lazily across newlines
const nameRegex = /<button onClick={\(\) => { setViewingOffersRecruitId\(r\.id\); setViewingOffersStartOfferBuilder\(false\); }} style={{ \.\.\.styles\.linkButton, fontWeight: 'bold' }}>\s*{r\.name}\s*<\/button>/;
// We'll construct the replacement using the matched name content if possible, or just assume format
// Actually, let's just replace the open tag and close tag if we can identify them, but simpler to replace the block.
// We'll capture the whitespace and r.name
content = content.replace(nameRegex, (match) => {
    // Keep internal whitespace structure
    return match.replace('<button', '<span')
                .replace('style={{ ...styles.linkButton, fontWeight: \'bold\' }}>', 'style={{ fontWeight: \'bold\', color: \'black\', cursor: \'pointer\', textDecoration: \'underline\' }}>')
                .replace('</button>', '</span>');
});

// 2. Replace Status Button (Offers)
// <button onClick={() => { setViewingOffersRecruitId(r.id); setViewingOffersStartOfferBuilder(false); }} style={styles.linkButton}>{totalOffers} Offers</button>
const offersRegex = /<button onClick={\(\) => { setViewingOffersRecruitId\(r\.id\); setViewingOffersStartOfferBuilder\(false\); }} style={styles\.linkButton}>{totalOffers} Offers<\/button>/;
content = content.replace(offersRegex, 
    '<span onClick={() => { setViewingOffersRecruitId(r.id); setViewingOffersStartOfferBuilder(false); }} style={{ cursor: \'pointer\', textDecoration: \'underline\', color: \'black\' }}>{totalOffers} Offers</span>'
);

// 3. Replace 'Undecided'
// ) : 'Undecided'}
const undecidedRegex = /\) : 'Undecided'}/;
content = content.replace(undecidedRegex, 
    ') : (<span onClick={() => { setViewingOffersRecruitId(r.id); setViewingOffersStartOfferBuilder(false); }} style={{ cursor: \'pointer\', textDecoration: \'underline\', color: \'black\' }}>Undecided</span>)}'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Refactor complete");
